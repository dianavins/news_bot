import React, { useState, useEffect } from 'react';

interface Story {
  id: string;
  title: string;
  subtitle: string;
  number: number;
  unified_summary?: string;
  created_at?: string;
  sources?: Array<{
    source: string;
    url: string;
    perspective?: string;
  }>;
}

interface StoriesScreenProps {
  stories: Story[];
  onStorySelect: (storyId: string) => void;
  onBack: () => void;
}

const StoriesScreen: React.FC<StoriesScreenProps> = ({ stories, onStorySelect, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'number' | 'date'>('number');

  const sortedStories = [...stories].sort((a, b) => {
    if (sortBy === 'number') {
      return a.number - b.number;
    } else {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Most recent first
    }
  });

  const handleStoryClick = (storyId: string) => {
    setSelectedStoryId(storyId);
    onStorySelect(storyId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourcesPreview = (story: Story) => {
    if (!story.sources || story.sources.length === 0) return '';
    const sourceNames = story.sources.map(s => s.source).slice(0, 3);
    const more = story.sources.length > 3 ? ` +${story.sources.length - 3} more` : '';
    return `Sources: ${sourceNames.join(', ')}${more}`;
  };

  return (
    <div className="stories-screen screen">
      <div className="stories-container">
        <div className="stories-header">
          <div className="stories-navigation">
            <button onClick={onBack} className="back-btn">← Back to Home</button>
            <h2 className="stories-title">TODAY'S NEWS</h2>
          </div>
          
          <div className="stories-controls">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'number' | 'date')}
                className="sort-select"
              >
                <option value="number">Story Number</option>
                <option value="date">Most Recent</option>
              </select>
            </div>
            <div className="stories-count">
              {stories.length} stories found
            </div>
          </div>
        </div>

        <div className="stories-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">🔄</div>
              <p>Loading stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <h3>No Stories Available</h3>
              <p>Check back later or refresh to load new stories.</p>
              <button 
                onClick={() => window.electronAPI?.refreshNews()} 
                className="refresh-btn"
              >
                🔄 Refresh News
              </button>
            </div>
          ) : (
            <div className="stories-list">
              {sortedStories.map(story => (
                <div 
                  key={story.id} 
                  className={`story-item ${selectedStoryId === story.id ? 'selected' : ''}`}
                  onClick={() => handleStoryClick(story.id)}
                >
                  <div className="story-header">
                    <span className="story-number">{story.number}.</span>
                    <div className="story-meta">
                      {story.created_at && (
                        <span className="story-date">{formatDate(story.created_at)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="story-content">
                    <h3 className="story-title">{story.title}</h3>
                    <p className="story-subtitle">{story.subtitle}</p>
                    
                    {story.unified_summary && (
                      <div className="story-preview">
                        {story.unified_summary.substring(0, 150)}
                        {story.unified_summary.length > 150 && '...'}
                      </div>
                    )}
                    
                    <div className="story-footer">
                      <span className="sources-preview">{getSourcesPreview(story)}</span>
                      <span className="read-more">Click to read more →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoriesScreen;