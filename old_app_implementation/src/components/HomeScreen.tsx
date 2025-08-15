import React from 'react';

interface HomeScreenProps {
  onViewNews: () => void;
  onSettings: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onViewNews, onSettings }) => {
  return (
    <div id="home-screen" className="screen active">
      <div className="home-container">
        <button 
          onClick={onSettings} 
          className="settings-icon-btn"
          title="Settings"
        >
          ⚙️
        </button>
        <h1 className="app-title">News Bot</h1>
        <button onClick={onViewNews} className="view-news-btn">
          VIEW THE NEWS
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;