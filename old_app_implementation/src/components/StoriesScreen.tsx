import React from 'react';

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
  onSettings: () => void;
}

const StoriesScreen: React.FC<StoriesScreenProps> = ({ stories, onStorySelect, onBack, onSettings }) => {
  const getLastRefresh = () => {
    // Get current time for "Last refresh" display
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div id="stories-screen" className="screen">
      <div className="stories-container">
        <button 
          onClick={onSettings} 
          className="settings-icon-btn"
          title="Settings"
        >
          ⚙️
        </button>
        
        <div className="stories-sidebar">
          <h2 className="stories-title">TODAY'S<br />NEWS</h2>
          <div className="last-refresh">
            Last refresh: {getLastRefresh()}
          </div>
        </div>
        
        <div className="stories-list" id="stories-list">
          {stories.length === 0 ? (
            <div className="loading">Loading stories...</div>
          ) : (
            stories.map(story => (
              <div 
                key={story.id} 
                className="story-item"
                onClick={() => onStorySelect(story.id)}
              >
                <span className="story-number">{story.number}.</span>
                <div className="story-content">
                  <h3 className="story-title">{story.title}</h3>
                  <p className="story-subtitle">{story.subtitle}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StoriesScreen;