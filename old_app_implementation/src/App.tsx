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
    const isElectron = window.electronAPI !== undefined;
    console.log('Running in Electron:', isElectron);
    
    if (isElectron) {
      // Set up IPC communication with Electron main process
      setupElectronIPC();
    }
  }, []);

  const setupElectronIPC = async () => {
    console.log('Setting up Electron IPC...');
    
    if (!window.electronAPI) return;
    
    try {
      // Get app info
      const appInfo = await window.electronAPI.getAppInfo();
      console.log('App info:', appInfo);
      
      // Set up event listeners
      window.electronAPI.onNavigateToSettings(() => {
        console.log('Navigate to settings requested');
        setCurrentScreen('settings');
      });
      
      window.electronAPI.onRefreshNews(() => {
        console.log('Refresh news requested');
        // TODO: Implement news refresh
      });
      
      console.log('✅ Electron IPC setup complete');
    } catch (error) {
      console.error('❌ Error setting up Electron IPC:', error);
    }
  };

  const navigateToStories = async () => {
    setCurrentScreen('stories');
    // Load stories from database
    if (window.electronAPI) {
      try {
        const storiesData = await window.electronAPI.getStories(10, 0);
        setStories(storiesData);
        console.log(`Loaded ${storiesData.length} stories from database`);
      } catch (error) {
        console.error('Failed to load stories:', error);
      }
    }
  };

  const navigateToStory = async (storyId: string) => {
    setCurrentScreen('story');
    // Load specific story
    if (window.electronAPI) {
      try {
        const storyData = await window.electronAPI.getStory(storyId);
        setCurrentStory(storyData);
        console.log(`Loaded story: ${storyData ? storyData.title : 'Not found'}`);
      } catch (error) {
        console.error('Failed to load story:', error);
      }
    }
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
                  onSettings={navigateToSettings}
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