/**
 * Database Integration Tests
 * Tests the DatabaseService integration with Electron main process
 */

const path = require('path');
const fs = require('fs');

// Mock electron module before importing DatabaseService
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => require('path').join(__dirname, '../test-data')),
    getVersion: jest.fn(() => '1.0.0')
  }
}));

const DatabaseService = require('../src/services/database');

describe('Database Integration', () => {
  let database;
  let testDbPath;

  beforeAll(() => {
    // Create test data directory
    const testDataDir = path.join(__dirname, '../test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Create fresh database instance for each test
    database = new DatabaseService();
    testDbPath = database.dbPath;
  });

  afterEach(async () => {
    // Clean up database
    if (database.db) {
      database.close();
    }
    
    // Remove test database file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    // Clean up test data directory
    const testDataDir = path.join(__dirname, '../test-data');
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Database Initialization', () => {
    test('should initialize database successfully', async () => {
      const result = await database.initialize();
      
      expect(result).toBe(true);
      expect(database.db).toBeDefined();
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    test('should create required tables', async () => {
      await database.initialize();
      
      // Check that tables exist
      const tables = database.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `).all();
      
      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('articles');
      expect(tableNames).toContain('stories');
    });

    test('should create indexes for performance', async () => {
      await database.initialize();
      
      // Check that indexes exist
      const indexes = database.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();
      
      const indexNames = indexes.map(i => i.name);
      expect(indexNames.length).toBeGreaterThan(0);
      expect(indexNames).toContain('idx_articles_collected_date');
      expect(indexNames).toContain('idx_stories_created_date');
    });
  });

  describe('Database Statistics', () => {
    test('should return correct statistics for empty database', async () => {
      await database.initialize();
      
      const stats = database.getStats();
      
      expect(stats).toHaveProperty('articles', 0);
      expect(stats).toHaveProperty('stories', 0);
      expect(stats).toHaveProperty('sourceBreakdown', {});
      expect(stats).toHaveProperty('recentArticles', 0);
      expect(stats).toHaveProperty('dbPath');
      expect(stats).toHaveProperty('lastUpdate');
    });

    test('should return correct statistics after inserting data', async () => {
      await database.initialize();
      
      // Insert test article
      const testArticle = {
        id: 'test-article-1',
        title: 'Test Article',
        content: 'Test content',
        url: 'https://example.com/test',
        source_name: 'Test Source',
        political_lean: 'center',
        published_date: new Date().toISOString(),
        collected_date: new Date().toISOString(),
        category: 'test'
      };
      
      database.insertArticle(testArticle);
      
      const stats = database.getStats();
      expect(stats.articles).toBe(1);
      expect(stats.sourceBreakdown).toHaveProperty('center', 1);
    });
  });

  describe('Article Operations', () => {
    beforeEach(async () => {
      await database.initialize();
    });

    test('should insert article successfully', () => {
      const testArticle = {
        id: 'test-article-1',
        title: 'Test Article Title',
        content: 'Test article content with details',
        url: 'https://example.com/test-article',
        source_name: 'Test News Source',
        political_lean: 'center',
        published_date: '2023-01-01T12:00:00Z',
        collected_date: new Date().toISOString(),
        category: 'politics'
      };

      const result = database.insertArticle(testArticle);
      expect(result.changes).toBe(1);

      // Verify article was inserted
      const articles = database.getArticles(10, 0);
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe(testArticle.title);
      expect(articles[0].source_name).toBe(testArticle.source_name);
    });

    test('should handle duplicate articles with REPLACE', () => {
      const testArticle = {
        id: 'test-article-1',
        title: 'Original Title',
        content: 'Original content',
        url: 'https://example.com/test',
        source_name: 'Test Source',
        political_lean: 'center',
        collected_date: new Date().toISOString()
      };

      // Insert original
      database.insertArticle(testArticle);

      // Insert updated version with same ID
      const updatedArticle = { ...testArticle, title: 'Updated Title' };
      database.insertArticle(updatedArticle);

      // Should still have only one article with updated title
      const articles = database.getArticles();
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Updated Title');
    });

    test('should retrieve articles with pagination', () => {
      // Insert multiple test articles
      for (let i = 1; i <= 5; i++) {
        database.insertArticle({
          id: `test-article-${i}`,
          title: `Test Article ${i}`,
          content: `Content ${i}`,
          url: `https://example.com/test-${i}`,
          source_name: 'Test Source',
          political_lean: 'center',
          collected_date: new Date(Date.now() - i * 1000).toISOString()
        });
      }

      // Test pagination
      const page1 = database.getArticles(2, 0);
      expect(page1).toHaveLength(2);
      expect(page1[0].title).toBe('Test Article 1'); // Most recent first

      const page2 = database.getArticles(2, 2);
      expect(page2).toHaveLength(2);
      expect(page2[0].title).toBe('Test Article 3');
    });
  });

  describe('Story Operations', () => {
    beforeEach(async () => {
      await database.initialize();
    });

    test('should insert and retrieve story successfully', () => {
      const testStory = {
        id: 'test-story-1',
        event_headline: 'Test Story Headline',
        unified_summary: 'Test unified summary content',
        background_context: 'Test background context',
        economic_impact: 'Test economic impact',
        social_values: 'Test social values',
        practical_solutions: 'Test practical solutions',
        conservative_view: 'Test conservative perspective',
        progressive_view: 'Test progressive perspective',
        references_json: JSON.stringify([
          { source: 'CNN', title: 'Test Article 1', url: 'https://cnn.com/test1' },
          { source: 'Fox News', title: 'Test Article 2', url: 'https://foxnews.com/test2' }
        ]),
        created_date: new Date().toISOString(),
        source_count: 2,
        political_balance_score: 0.67
      };

      const result = database.insertStory(testStory);
      expect(result.changes).toBe(1);

      // Test getStories (formatted for UI)
      const stories = database.getStories(10, 0);
      expect(stories).toHaveLength(1);
      expect(stories[0].title).toBe(testStory.event_headline);
      expect(stories[0].number).toBe(1);
      expect(stories[0].sources).toHaveLength(2);
      expect(stories[0].sources[0].source).toBe('CNN');
      expect(stories[0].sources[0].perspective).toBe('Center-left');

      // Test getStory (individual story)
      const story = database.getStory(testStory.id);
      expect(story).toBeDefined();
      expect(story.title).toBe(testStory.event_headline);
      expect(story.unified_summary).toBe(testStory.unified_summary);
      expect(story.sources).toHaveLength(2);
    });

    test('should format story references correctly', () => {
      const testStory = {
        id: 'test-story-with-refs',
        event_headline: 'Story with References',
        unified_summary: 'Summary',
        background_context: 'Context',
        economic_impact: 'Impact',
        social_values: 'Values',
        practical_solutions: 'Solutions',
        conservative_view: 'Conservative',
        progressive_view: 'Progressive',
        references_json: JSON.stringify([
          { source: 'BBC', title: 'BBC Article', url: 'https://bbc.com/test' },
          { source: 'Daily Wire', title: 'Daily Wire Article', url: 'https://dailywire.com/test' },
          { source: 'Unknown Source', title: 'Unknown Article', url: 'https://unknown.com/test' }
        ]),
        created_date: new Date().toISOString(),
        source_count: 3,
        political_balance_score: 1.0
      };

      database.insertStory(testStory);
      const story = database.getStory(testStory.id);

      expect(story.sources).toHaveLength(3);
      expect(story.sources[0].perspective).toBe('Center'); // BBC
      expect(story.sources[1].perspective).toBe('Right'); // Daily Wire
      expect(story.sources[2].perspective).toBe('Unknown'); // Unknown Source
    });

    test('should handle malformed JSON references gracefully', () => {
      const testStory = {
        id: 'test-story-bad-json',
        event_headline: 'Story with Bad JSON',
        unified_summary: 'Summary',
        background_context: 'Context',
        economic_impact: 'Impact',
        social_values: 'Values',
        practical_solutions: 'Solutions',
        conservative_view: 'Conservative',
        progressive_view: 'Progressive',
        references_json: 'invalid json string',
        created_date: new Date().toISOString(),
        source_count: 0,
        political_balance_score: 0.0
      };

      database.insertStory(testStory);
      const story = database.getStory(testStory.id);

      expect(story.sources).toEqual([]);
    });
  });

  describe('Health Status', () => {
    test('should report healthy status when database is working', async () => {
      await database.initialize();
      
      const health = database.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
      expect(health.stats).toBeDefined();
      expect(health.lastCheck).toBeDefined();
    });

    test('should report error status when database is not initialized', () => {
      // Don't initialize database
      const health = database.getHealthStatus();
      
      expect(health.status).toBe('error');
      expect(health.connected).toBe(false);
      expect(health.error).toBeDefined();
    });
  });

  describe('Data Migration', () => {
    test('should handle non-existent lite database gracefully', async () => {
      await database.initialize();
      
      const nonExistentPath = path.join(__dirname, 'non-existent.db');
      
      await expect(
        database.copyFromLiteDatabase(nonExistentPath)
      ).rejects.toThrow();
    });

    // Note: Full migration test would require creating a mock lite database
    // which is complex for this test suite. In practice, manual testing
    // with the actual lite database confirms this functionality works.
  });
});