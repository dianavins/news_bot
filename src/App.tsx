import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import components (will create these next)
import HomeScreen from './components/HomeScreen';
import StoriesScreen from './components/StoriesScreen';
import StoryScreen from './components/StoryScreen';
import SettingsScreen from './components/SettingsScreen';

// Desktop app main component
function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'stories' | 'story' | 'settings'>('home');
  const [stories, setStories] = useState<any[]>([]);
  const [currentStory, setCurrentStory] = useState<any>(null);

  // Initialize app
  useEffect(() => {
    console.log('News Bot Desktop App initialized');
    
    // Check if we're running in Electron
    const isElectron = window.navigator.userAgent.includes('Electron');
    console.log('Running in Electron:', isElectron);
    
    if (isElectron) {
      // Set up IPC communication with Electron main process
      setupElectronIPC();
    }
  }, []);

  const setupElectronIPC = () => {
    // Will implement IPC communication here
    console.log('Setting up Electron IPC...');
  };

  const navigateToStories = () => {
    setCurrentScreen('stories');
    // TODO: Load stories from database
  };

  const navigateToStory = (storyId: string) => {
    setCurrentScreen('story');
    // TODO: Load specific story
  };

  const navigateToSettings = () => {
    setCurrentScreen('settings');
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
  };

  return (
    <div className="desktop-app">
      <Router>
        <Routes>
          <Route path="/" element={
            <>
              {currentScreen === 'home' && (
                <HomeScreen onViewNews={navigateToStories} onSettings={navigateToSettings} />
              )}
              {currentScreen === 'stories' && (
                <StoriesScreen 
                  stories={stories} 
                  onStorySelect={navigateToStory}
                  onBack={navigateToHome}
                />
              )}
              {currentScreen === 'story' && (
                <StoryScreen 
                  story={currentStory}
                  onBack={navigateToStories}
                />
              )}
              {currentScreen === 'settings' && (
                <SettingsScreen onBack={navigateToHome} />
              )}
            </>
          } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;