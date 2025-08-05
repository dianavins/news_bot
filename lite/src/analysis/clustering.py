"""Story clustering algorithm for grouping articles by specific events."""

import sqlite3
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
from collections import Counter, defaultdict
import re
from datetime import datetime
import hashlib
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import DATABASE_PATH

class EventClusterer:
    def __init__(self):
        self.database_path = DATABASE_PATH
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2
        )
        
    def load_articles(self):
        """Load articles from database for clustering."""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, content, source_name, political_lean, url, collected_date
            FROM articles 
            ORDER BY collected_date DESC
        ''')
        
        articles = []
        for row in cursor.fetchall():
            articles.append({
                'id': row[0],
                'title': row[1],
                'content': row[2] or '',
                'source_name': row[3],
                'political_lean': row[4],
                'url': row[5],
                'collected_date': row[6]
            })
        
        conn.close()
        print(f"Loaded {len(articles)} articles for clustering")
        return articles
    
    def extract_named_entities(self, text):
        """Simple named entity extraction for event validation."""
        # Basic patterns for important entities
        patterns = {
            'people': r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',
            'organizations': r'\b(?:NATO|EU|UN|FBI|CIA|GOP|NASA|WHO)\b',
            'countries': r'\b(?:US|USA|China|Russia|Ukraine|Israel|Iran|UK|France|Germany)\b',
            'dates': r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?\b'
        }
        
        entities = set()
        for category, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities.update([match.lower() for match in matches])
        
        return entities
    
    def calculate_event_similarity(self, articles):
        """Calculate similarity matrix for articles using multiple signals."""
        # Combine title and first sentence of content for clustering
        texts = []
        for article in articles:
            # Use title + first sentence of content
            content_first_sentence = article['content'].split('.')[0] if article['content'] else ''
            combined_text = f"{article['title']} {content_first_sentence}"
            texts.append(combined_text)
        
        # Calculate TF-IDF similarity
        tfidf_matrix = self.vectorizer.fit_transform(texts)
        similarity_matrix = cosine_similarity(tfidf_matrix)
        
        # Enhance similarity with named entity overlap
        for i, article1 in enumerate(articles):
            entities1 = self.extract_named_entities(f"{article1['title']} {article1['content']}")
            
            for j, article2 in enumerate(articles):
                if i != j:
                    entities2 = self.extract_named_entities(f"{article2['title']} {article2['content']}")
                    
                    # Calculate entity overlap bonus
                    if entities1 and entities2:
                        overlap = len(entities1.intersection(entities2))
                        total = len(entities1.union(entities2))
                        entity_boost = (overlap / total) * 0.3 if total > 0 else 0
                        similarity_matrix[i][j] = min(1.0, similarity_matrix[i][j] + entity_boost)
        
        return similarity_matrix
    
    def cluster_articles(self, articles, min_cluster_size=2):
        """Cluster articles into event-specific groups."""
        if len(articles) < 2:
            return []
        
        similarity_matrix = self.calculate_event_similarity(articles)
        
        # Convert similarity to distance for DBSCAN
        # Ensure all values are valid distances (0 to 1)
        distance_matrix = np.clip(1 - similarity_matrix, 0, 1)
        
        # Use DBSCAN for clustering
        # eps=0.3 means articles need 70%+ similarity to be in same cluster (strict for quality)
        clustering = DBSCAN(eps=0.3, min_samples=min_cluster_size, metric='precomputed')
        cluster_labels = clustering.fit_predict(distance_matrix)
        
        # Group articles by cluster
        clusters = defaultdict(list)
        for idx, label in enumerate(cluster_labels):
            if label != -1:  # -1 is noise/unclustered
                clusters[label].append(articles[idx])
        
        print(f"Found {len(clusters)} clusters from {len(articles)} articles")
        return list(clusters.values())
    
    def generate_cluster_headline(self, cluster_articles):
        """Generate a representative headline for the cluster."""
        # Use the most common key terms from titles
        all_titles = ' '.join([article['title'] for article in cluster_articles])
        
        # Simple approach: use the shortest, most complete title
        best_title = min(cluster_articles, key=lambda x: len(x['title']))['title']
        
        return best_title
    
    def calculate_importance_score(self, cluster_articles):
        """Calculate importance score for ranking clusters."""
        source_count = len(cluster_articles)
        
        # Political diversity bonus
        political_leans = set(article['political_lean'] for article in cluster_articles)
        diversity_bonus = len(political_leans) * 2  # Bonus for cross-spectrum coverage
        
        # Recency weight (articles from today get bonus)
        today = datetime.now().date()
        recent_count = 0
        for article in cluster_articles:
            article_date = datetime.fromisoformat(article['collected_date']).date()
            if article_date == today:
                recent_count += 1
        
        recency_weight = recent_count * 1.5
        
        # Named entity importance (simple heuristic)
        all_text = ' '.join([f"{a['title']} {a['content']}" for a in cluster_articles])
        entities = self.extract_named_entities(all_text)
        entity_importance = len(entities) * 0.5
        
        total_score = source_count * 2 + diversity_bonus + recency_weight + entity_importance
        
        return total_score
    
    def get_top_stories(self, max_stories=15):
        """Get top news stories clustered by event."""
        articles = self.load_articles()
        
        if not articles:
            print("No articles found for clustering")
            return []
        
        # Cluster articles into events
        clusters = self.cluster_articles(articles)
        
        # Create story objects with metadata
        stories = []
        for cluster in clusters:
            if len(cluster) >= 2:  # Only include stories covered by multiple sources
                story = {
                    'id': hashlib.md5(str(sorted([a['id'] for a in cluster])).encode()).hexdigest(),
                    'headline': self.generate_cluster_headline(cluster),
                    'articles': cluster,
                    'source_count': len(cluster),
                    'political_diversity': len(set(a['political_lean'] for a in cluster)),
                    'sources_by_lean': self._group_sources_by_lean(cluster),
                    'importance_score': self.calculate_importance_score(cluster)
                }
                stories.append(story)
        
        # Sort by importance score and return top stories
        stories.sort(key=lambda x: x['importance_score'], reverse=True)
        
        # Quality over quantity - return what we have, don't force max_stories
        top_stories = stories[:max_stories] if len(stories) >= max_stories else stories
        
        print(f"Found {len(stories)} quality story clusters (showing top {len(top_stories)}):")
        for i, story in enumerate(top_stories):
            print(f"{i+1}. {story['headline']} (Score: {story['importance_score']:.1f}, Sources: {story['source_count']})")
        
        return top_stories
    
    def _group_sources_by_lean(self, articles):
        """Group articles by political lean."""
        by_lean = defaultdict(list)
        for article in articles:
            by_lean[article['political_lean']].append({
                'source': article['source_name'],
                'title': article['title'],
                'url': article['url']
            })
        return dict(by_lean)

def main():
    """Test the clustering algorithm."""
    clusterer = EventClusterer()
    top_stories = clusterer.get_top_stories(10)
    
    print(f"\n=== TOP 10 STORIES ===")
    for i, story in enumerate(top_stories, 1):
        print(f"\n{i}. {story['headline']}")
        print(f"   Sources: {story['source_count']} | Political Diversity: {story['political_diversity']} | Score: {story['importance_score']:.1f}")
        
        # Show source breakdown
        for lean, articles in story['sources_by_lean'].items():
            sources = [a['source'] for a in articles]
            print(f"   {lean.capitalize()}: {', '.join(set(sources))}")

if __name__ == "__main__":
    main()