import React, { useState, useEffect } from 'react';

interface HomeScreenProps {
  onViewNews: () => void;
  onSettings: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onViewNews, onSettings }) => {
  const [isElectron, setIsElectron] = useState(false);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [newsStatus, setNewsStatus] = useState<'idle' | 'refreshing' | 'error'>('idle');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const electronAvailable = window.electronAPI !== undefined;
    setIsElectron(electronAvailable);
    
    if (electronAvailable) {
      loadAppInfo();
    }
  }, []);

  const loadAppInfo = async () => {
    try {
      if (window.electronAPI) {
        const info = await window.electronAPI.getAppInfo();
        setAppInfo(info);
      }
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  };

  const handleRefreshNews = async () => {
    if (!window.electronAPI) return;
    
    setNewsStatus('refreshing');
    try {
      await window.electronAPI.refreshNews();
      setLastRefresh(new Date());
      setNewsStatus('idle');
    } catch (error) {
      console.error('Failed to refresh news:', error);
      setNewsStatus('error');
    }
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastRefresh.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="home-screen screen">
      <div className="home-container">
        <header className="home-header">
          <h1 className="app-title">News Bot</h1>
          <p className="app-subtitle">Anti-Echo Chamber News Aggregation</p>
          {appInfo && (
            <div className="app-info">
              <span className="version">v{appInfo.version}</span>
            </div>
          )}
        </header>

        <div className="home-actions">
          <button 
            onClick={onViewNews} 
            className="primary-btn view-news-btn"
            disabled={newsStatus === 'refreshing'}
          >
            {newsStatus === 'refreshing' ? '🔄 Refreshing...' : '📰 VIEW THE NEWS'}
          </button>

          {isElectron && (
            <button 
              onClick={handleRefreshNews}
              className="secondary-btn refresh-btn"
              disabled={newsStatus === 'refreshing'}
            >
              {newsStatus === 'refreshing' ? 'Refreshing...' : '🔄 Refresh News'}
            </button>
          )}

          <button onClick={onSettings} className="secondary-btn settings-btn">
            ⚙️ Settings
          </button>
        </div>

        <div className="home-status">
          <div className="status-item">
            <span className="status-label">Last Refresh:</span>
            <span className="status-value">{formatLastRefresh()}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Platform:</span>
            <span className="status-value">{isElectron ? 'Desktop' : 'Web'}</span>
          </div>
          {newsStatus === 'error' && (
            <div className="status-error">
              ⚠️ Failed to refresh news. Check your internet connection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;