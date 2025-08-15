/**
 * Database service for News Bot desktop application
 * Provides SQLite database operations for articles and stories
 */

const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    // Use app data directory for production, current directory for development
    const isDev = process.env.NODE_ENV === 'development';
    const dbDir = isDev 
      ? path.join(__dirname, '../../data') 
      : path.join(app.getPath('userData'), 'data');
    
    // Ensure data directory exists
    const fs = require('fs');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, 'news.db');
    this.db = null;
    
    console.log(`📁 Database path: ${this.dbPath}`);
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // Better performance for concurrent access
      this.db.pragma('foreign_keys = ON');  // Enable foreign key constraints
      
      console.log('🗄️ Database connection established');
      
      // Create tables if they don't exist
      this.createTables();
      
      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables matching the lite version schema
   */
  createTables() {
    // Articles table - stores raw news articles
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        url TEXT UNIQUE NOT NULL,
        source_name TEXT NOT NULL,
        political_lean TEXT NOT NULL,
        published_date TEXT,
        collected_date TEXT NOT NULL,
        category TEXT DEFAULT 'general'
      )
    `);

    // Stories table - stores processed/synthesized stories
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        event_headline TEXT NOT NULL,
        unified_summary TEXT NOT NULL,
        background_context TEXT NOT NULL,
        economic_impact TEXT NOT NULL,
        social_values TEXT NOT NULL,
        practical_solutions TEXT NOT NULL,
        conservative_view TEXT NOT NULL,
        progressive_view TEXT NOT NULL,
        references_json TEXT NOT NULL,
        created_date TEXT NOT NULL,
        source_count INTEGER,
        political_balance_score REAL
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_articles_collected_date ON articles(collected_date DESC);
      CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_name);
      CREATE INDEX IF NOT EXISTS idx_articles_political_lean ON articles(political_lean);
      CREATE INDEX IF NOT EXISTS idx_stories_created_date ON stories(created_date DESC);
      CREATE INDEX IF NOT EXISTS idx_stories_balance_score ON stories(political_balance_score DESC);
    `);

    console.log('📋 Database tables created/verified');
  }

  /**
   * Get database statistics
   */
  getStats() {
    const articlesCount = this.db.prepare('SELECT COUNT(*) as count FROM articles').get();
    const storiesCount = this.db.prepare('SELECT COUNT(*) as count FROM stories').get();
    
    const sourceBreakdown = this.db.prepare(`
      SELECT political_lean, COUNT(*) as count 
      FROM articles 
      GROUP BY political_lean
    `).all();

    const recentArticles = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE datetime(collected_date) > datetime('now', '-24 hours')
    `).get();

    return {
      articles: articlesCount.count,
      stories: storiesCount.count,
      sourceBreakdown: sourceBreakdown.reduce((acc, row) => {
        acc[row.political_lean] = row.count;
        return acc;
      }, {}),
      recentArticles: recentArticles.count,
      dbPath: this.dbPath,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get stories for the UI (formatted for React components)
   */
  getStories(limit = 10, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        event_headline as title,
        unified_summary as subtitle,
        unified_summary,
        background_context,
        economic_impact,
        social_values,
        practical_solutions,
        conservative_view,
        progressive_view,
        references_json,
        created_date,
        source_count,
        political_balance_score
      FROM stories 
      ORDER BY created_date DESC, political_balance_score DESC
      LIMIT ? OFFSET ?
    `);

    const stories = stmt.all(limit, offset);
    
    // Transform for React components
    return stories.map((story, index) => ({
      id: story.id,
      title: story.title,
      subtitle: story.subtitle,
      number: offset + index + 1,
      unified_summary: story.unified_summary,
      background_context: story.background_context,
      economic_impact: story.economic_impact,
      social_values: story.social_values,
      practical_solutions: story.practical_solutions,
      conservative_view: story.conservative_view,
      progressive_view: story.progressive_view,
      created_at: story.created_date,
      source_count: story.source_count,
      political_balance_score: story.political_balance_score,
      sources: this.getStoryReferences(story.references_json)
    }));
  }

  /**
   * Get a single story by ID
   */
  getStory(storyId) {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        event_headline as title,
        unified_summary as subtitle,
        unified_summary,
        background_context,
        economic_impact,
        social_values,
        practical_solutions,
        conservative_view,
        progressive_view,
        references_json,
        created_date,
        source_count,
        political_balance_score
      FROM stories 
      WHERE id = ?
    `);

    const story = stmt.get(storyId);
    
    if (!story) {
      return null;
    }

    return {
      id: story.id,
      title: story.title,
      subtitle: story.subtitle,
      number: 1, // Will be set by caller if needed
      unified_summary: story.unified_summary,
      background_context: story.background_context,
      economic_impact: story.economic_impact,
      social_values: story.social_values,
      practical_solutions: story.practical_solutions,
      conservative_view: story.conservative_view,
      progressive_view: story.progressive_view,
      created_at: story.created_date,
      source_count: story.source_count,
      political_balance_score: story.political_balance_score,
      sources: this.getStoryReferences(story.references_json)
    };
  }

  /**
   * Parse and format story references
   */
  getStoryReferences(referencesJson) {
    try {
      const references = JSON.parse(referencesJson);
      return references.map(ref => ({
        source: ref.source,
        url: ref.url,
        title: ref.title,
        perspective: this.getSourcePerspective(ref.source)
      }));
    } catch (error) {
      console.error('Error parsing story references:', error);
      return [];
    }
  }

  /**
   * Get political perspective for a source (simplified mapping)
   */
  getSourcePerspective(sourceName) {
    const perspectives = {
      'CNN': 'Center-left',
      'Fox News': 'Right',
      'MSNBC': 'Left',
      'BBC': 'Center',
      'Reuters': 'Center',
      'AP News': 'Center',
      'NPR': 'Center-left',
      'Wall Street Journal': 'Center-right',
      'New York Times': 'Center-left',
      'Washington Post': 'Center-left',
      'The Guardian': 'Center-left',
      'Daily Wire': 'Right',
      'Breitbart': 'Right',
      'Vox': 'Left',
      'Politico': 'Center'
    };

    return perspectives[sourceName] || 'Unknown';
  }

  /**
   * Get raw articles (for clustering/processing)
   */
  getArticles(limit = 100, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT 
        id, title, content, url, source_name, political_lean, 
        published_date, collected_date, category
      FROM articles 
      ORDER BY collected_date DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset);
  }

  /**
   * Insert a new article
   */
  insertArticle(article) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO articles 
      (id, title, content, url, source_name, political_lean, published_date, collected_date, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        article.id,
        article.title,
        article.content,
        article.url,
        article.source_name,
        article.political_lean,
        article.published_date,
        article.collected_date || new Date().toISOString(),
        article.category || 'general'
      );

      console.log(`📰 Article inserted: ${article.title.substring(0, 50)}...`);
      return result;
    } catch (error) {
      console.error('Error inserting article:', error);
      throw error;
    }
  }

  /**
   * Insert a new processed story
   */
  insertStory(story) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO stories 
      (id, event_headline, unified_summary, background_context, economic_impact, 
       social_values, practical_solutions, conservative_view, progressive_view, 
       references_json, created_date, source_count, political_balance_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        story.id,
        story.event_headline,
        story.unified_summary,
        story.background_context,
        story.economic_impact,
        story.social_values,
        story.practical_solutions,
        story.conservative_view,
        story.progressive_view,
        story.references_json,
        story.created_date || new Date().toISOString(),
        story.source_count,
        story.political_balance_score
      );

      console.log(`📚 Story inserted: ${story.event_headline.substring(0, 50)}...`);
      return result;
    } catch (error) {
      console.error('Error inserting story:', error);
      throw error;
    }
  }

  /**
   * Copy data from lite version database (for migration)
   */
  async copyFromLiteDatabase(liteDbPath) {
    try {
      console.log(`🔄 Copying data from lite database: ${liteDbPath}`);
      
      const liteDb = new Database(liteDbPath, { readonly: true });
      
      // Copy articles
      const articles = liteDb.prepare('SELECT * FROM articles').all();
      console.log(`📰 Found ${articles.length} articles to copy`);
      
      for (const article of articles) {
        this.insertArticle(article);
      }

      // Copy stories
      const stories = liteDb.prepare('SELECT * FROM stories').all();
      console.log(`📚 Found ${stories.length} stories to copy`);
      
      for (const story of stories) {
        this.insertStory(story);
      }

      liteDb.close();
      
      console.log('✅ Data migration completed successfully');
      return { articles: articles.length, stories: stories.length };
    } catch (error) {
      console.error('❌ Data migration failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('🗄️ Database connection closed');
    }
  }

  /**
   * Get database health status
   */
  getHealthStatus() {
    try {
      // Test basic operations
      const testQuery = this.db.prepare('SELECT 1 as test').get();
      const stats = this.getStats();
      
      return {
        status: 'healthy',
        connected: true,
        stats: stats,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
}

module.exports = DatabaseService;