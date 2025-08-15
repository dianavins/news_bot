import React, { useState, useEffect } from 'react';

interface Source {
  source: string;
  url: string;
  perspective?: string;
  summary?: string;
}

interface Story {
  id: string;
  title: string;
  subtitle: string;
  number: number;
  unified_summary?: string;
  created_at?: string;
  sources?: Source[];
}

interface StoryScreenProps {
  story: Story | null;
  onBack: () => void;
}

const StoryScreen: React.FC<StoryScreenProps> = ({ story, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'sources' | 'analysis'>('summary');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExternalLink = (url: string) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getPerspectiveColor = (perspective?: string) => {
    if (!perspective) return '#666';
    const lower = perspective.toLowerCase();
    if (lower.includes('left') || lower.includes('liberal')) return '#2196F3';
    if (lower.includes('right') || lower.includes('conservative')) return '#FF5722'; 
    if (lower.includes('center') || lower.includes('moderate')) return '#4CAF50';
    return '#9C27B0';
  };

  if (!story) {
    return (
      <div className="story-screen screen">
        <div className="story-container">
          <button onClick={onBack} className="back-btn">← Back to Stories</button>
          <div className="loading-container">
            <div className="loading-spinner">🔄</div>
            <p>Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="story-screen screen">
      <div className="story-container">
        <div className="story-header">
          <button onClick={onBack} className="back-btn">← Back to Stories</button>
          <div className="story-meta">
            <span className="story-number">Story #{story.number}</span>
            {story.created_at && (
              <span className="story-timestamp">{formatDate(story.created_at)}</span>
            )}
          </div>
        </div>

        <div className="story-main">
          <h1 className="story-title">{story.title}</h1>
          <p className="story-subtitle">{story.subtitle}</p>

          <div className="story-tabs">
            <button 
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              📄 Summary
            </button>
            <button 
              className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('sources')}
            >
              📰 Sources ({story.sources?.length || 0})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              🔍 Perspective Analysis
            </button>
          </div>

          <div className="story-content-area">
            {activeTab === 'summary' && (
              <div className="summary-tab">
                <div className="unified-summary">
                  <h3>Unified Summary</h3>
                  <div className="summary-content">
                    {story.unified_summary || 'No summary available for this story.'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="sources-tab">
                <h3>Source Articles</h3>
                {story.sources && story.sources.length > 0 ? (
                  <div className="sources-list">
                    {story.sources.map((source, index) => (
                      <div key={index} className="source-item">
                        <div className="source-header">
                          <div className="source-info">
                            <strong className="source-name">{source.source}</strong>
                            {source.perspective && (
                              <span 
                                className="source-perspective"
                                style={{ color: getPerspectiveColor(source.perspective) }}
                              >
                                {source.perspective}
                              </span>
                            )}
                          </div>
                          <div className="source-actions">
                            <button 
                              onClick={() => handleExternalLink(source.url)}
                              className="external-link-btn"
                            >
                              🔗 Read Original
                            </button>
                            <button
                              onClick={() => setExpandedSource(
                                expandedSource === source.url ? null : source.url
                              )}
                              className="expand-btn"
                            >
                              {expandedSource === source.url ? '▲' : '▼'}
                            </button>
                          </div>
                        </div>
                        
                        {expandedSource === source.url && source.summary && (
                          <div className="source-summary">
                            <h4>Article Summary:</h4>
                            <p>{source.summary}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-sources">
                    <p>No source articles available for this story.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="analysis-tab">
                <h3>Perspective Analysis</h3>
                {story.sources && story.sources.length > 0 ? (
                  <div className="perspective-analysis">
                    <div className="perspective-summary">
                      <p>This story includes perspectives from {story.sources.length} source(s):</p>
                      <div className="perspective-breakdown">
                        {story.sources.map((source, index) => (
                          <div key={index} className="perspective-item">
                            <span className="source-name">{source.source}</span>
                            <span 
                              className="perspective-label"
                              style={{ backgroundColor: getPerspectiveColor(source.perspective) }}
                            >
                              {source.perspective || 'Unknown'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="analysis-note">
                      <p><strong>Anti-Echo Chamber Analysis:</strong></p>
                      <p>This summary synthesizes information from multiple sources with different political perspectives to provide a more balanced view of the story.</p>
                    </div>
                  </div>
                ) : (
                  <div className="no-analysis">
                    <p>No perspective analysis available for this story.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryScreen;