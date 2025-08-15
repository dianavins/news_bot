import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock window.alert
global.alert = jest.fn();

// Import components
import HomeScreen from '../src/components/HomeScreen';
import StoriesScreen from '../src/components/StoriesScreen';
import StoryScreen from '../src/components/StoryScreen';
import SettingsScreen from '../src/components/SettingsScreen';

// Mock Electron API
global.window.electronAPI = {
  getAppInfo: jest.fn(() => Promise.resolve({
    version: '1.0.0',
    platform: 'Desktop',
    isDev: false,
    electronVersion: '22.3.0'
  })),
  refreshNews: jest.fn(() => Promise.resolve({ success: true, message: 'News refreshed' })),
  getSettings: jest.fn(() => Promise.resolve({
    refreshInterval: '12h',
    notifications: true,
    minimizeToTray: true,
    autoStart: false,
    theme: 'light'
  })),
  saveSettings: jest.fn(() => Promise.resolve({ success: true })),
  openExternal: jest.fn(() => Promise.resolve()),
  showLogs: jest.fn(() => Promise.resolve()),
  showAbout: jest.fn(() => Promise.resolve())
};

describe('Enhanced React Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HomeScreen', () => {
    test('renders with enhanced features', async () => {
      const mockOnViewNews = jest.fn();
      const mockOnSettings = jest.fn();

      render(
        <HomeScreen onViewNews={mockOnViewNews} onSettings={mockOnSettings} />
      );

      // Check main elements
      expect(screen.getByText('News Bot')).toBeInTheDocument();
      expect(screen.getByText('Anti-Echo Chamber News Aggregation')).toBeInTheDocument();
      expect(screen.getByText('📰 VIEW THE NEWS')).toBeInTheDocument();
      expect(screen.getByText('🔄 Refresh News')).toBeInTheDocument();
      expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();

      // Wait for app info to load
      await waitFor(() => {
        expect(screen.getByText('v1.0.0')).toBeInTheDocument();
      });

      // Check status section
      expect(screen.getByText('Last Refresh:')).toBeInTheDocument();
      expect(screen.getByText('Platform:')).toBeInTheDocument();
      expect(screen.getByText('Desktop')).toBeInTheDocument();
    });

    test('handles news refresh', async () => {
      const mockOnViewNews = jest.fn();
      const mockOnSettings = jest.fn();

      render(
        <HomeScreen onViewNews={mockOnViewNews} onSettings={mockOnSettings} />
      );

      const refreshButton = screen.getByText('🔄 Refresh News');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(window.electronAPI.refreshNews).toHaveBeenCalled();
      });
    });

    test('handles navigation clicks', () => {
      const mockOnViewNews = jest.fn();
      const mockOnSettings = jest.fn();

      render(
        <HomeScreen onViewNews={mockOnViewNews} onSettings={mockOnSettings} />
      );

      fireEvent.click(screen.getByText('📰 VIEW THE NEWS'));
      expect(mockOnViewNews).toHaveBeenCalled();

      fireEvent.click(screen.getByText('⚙️ Settings'));
      expect(mockOnSettings).toHaveBeenCalled();
    });
  });

  describe('StoriesScreen', () => {
    const mockStories = [
      {
        id: '1',
        title: 'Breaking News Story',
        subtitle: 'This is a test story',
        number: 1,
        unified_summary: 'Test summary content for the story',
        created_at: '2023-01-01T12:00:00Z',
        sources: [
          { source: 'CNN', url: 'https://cnn.com/story1', perspective: 'Center-left' },
          { source: 'Fox News', url: 'https://foxnews.com/story1', perspective: 'Right' }
        ]
      },
      {
        id: '2',
        title: 'Another News Story',
        subtitle: 'Second test story',
        number: 2,
        unified_summary: 'Another test summary',
        created_at: '2023-01-01T13:00:00Z',
        sources: [
          { source: 'BBC', url: 'https://bbc.com/story2', perspective: 'Center' }
        ]
      }
    ];

    test('renders stories list', () => {
      const mockOnStorySelect = jest.fn();
      const mockOnBack = jest.fn();

      render(
        <StoriesScreen 
          stories={mockStories} 
          onStorySelect={mockOnStorySelect} 
          onBack={mockOnBack} 
        />
      );

      expect(screen.getByText('TODAY\'S NEWS')).toBeInTheDocument();
      expect(screen.getByText('2 stories found')).toBeInTheDocument();
      expect(screen.getByText('Breaking News Story')).toBeInTheDocument();
      expect(screen.getByText('Another News Story')).toBeInTheDocument();
    });

    test('handles story selection', () => {
      const mockOnStorySelect = jest.fn();
      const mockOnBack = jest.fn();

      render(
        <StoriesScreen 
          stories={mockStories} 
          onStorySelect={mockOnStorySelect} 
          onBack={mockOnBack} 
        />
      );

      fireEvent.click(screen.getByText('Breaking News Story'));
      expect(mockOnStorySelect).toHaveBeenCalledWith('1');
    });

    test('shows empty state when no stories', () => {
      const mockOnStorySelect = jest.fn();
      const mockOnBack = jest.fn();

      render(
        <StoriesScreen 
          stories={[]} 
          onStorySelect={mockOnStorySelect} 
          onBack={mockOnBack} 
        />
      );

      expect(screen.getByText('No Stories Available')).toBeInTheDocument();
      expect(screen.getByText('🔄 Refresh News')).toBeInTheDocument();
    });

    test('handles sorting', () => {
      const mockOnStorySelect = jest.fn();
      const mockOnBack = jest.fn();

      render(
        <StoriesScreen 
          stories={mockStories} 
          onStorySelect={mockOnStorySelect} 
          onBack={mockOnBack} 
        />
      );

      const sortSelect = screen.getByDisplayValue('Story Number');
      fireEvent.change(sortSelect, { target: { value: 'date' } });
      
      expect(sortSelect.value).toBe('date');
    });
  });

  describe('StoryScreen', () => {
    const mockStory = {
      id: '1',
      title: 'Test Story Title',
      subtitle: 'Test story subtitle',
      number: 1,
      unified_summary: 'This is a comprehensive summary of the test story with multiple perspectives.',
      created_at: '2023-01-01T12:00:00Z',
      sources: [
        { 
          source: 'CNN', 
          url: 'https://cnn.com/story1', 
          perspective: 'Center-left',
          summary: 'CNN perspective on the story'
        },
        { 
          source: 'Fox News', 
          url: 'https://foxnews.com/story1', 
          perspective: 'Right',
          summary: 'Fox News perspective on the story'
        }
      ]
    };

    test('renders story details', () => {
      const mockOnBack = jest.fn();

      render(
        <StoryScreen story={mockStory} onBack={mockOnBack} />
      );

      expect(screen.getByText('Test Story Title')).toBeInTheDocument();
      expect(screen.getByText('Test story subtitle')).toBeInTheDocument();
      expect(screen.getByText('Story #1')).toBeInTheDocument();
      expect(screen.getByText('📄 Summary')).toBeInTheDocument();
      expect(screen.getByText('📰 Sources (2)')).toBeInTheDocument();
      expect(screen.getByText('🔍 Perspective Analysis')).toBeInTheDocument();
    });

    test('handles tab switching', () => {
      const mockOnBack = jest.fn();

      render(
        <StoryScreen story={mockStory} onBack={mockOnBack} />
      );

      // Click sources tab
      fireEvent.click(screen.getByText('📰 Sources (2)'));
      expect(screen.getByText('Source Articles')).toBeInTheDocument();
      expect(screen.getByText('CNN')).toBeInTheDocument();
      expect(screen.getByText('Fox News')).toBeInTheDocument();

      // Click analysis tab
      fireEvent.click(screen.getByText('🔍 Perspective Analysis'));
      expect(screen.getByText('Perspective Analysis')).toBeInTheDocument();
      expect(screen.getByText('Anti-Echo Chamber Analysis:')).toBeInTheDocument();
    });

    test('handles external link clicks', () => {
      const mockOnBack = jest.fn();

      render(
        <StoryScreen story={mockStory} onBack={mockOnBack} />
      );

      // Switch to sources tab
      fireEvent.click(screen.getByText('📰 Sources (2)'));
      
      // Click external link
      const externalLinks = screen.getAllByText('🔗 Read Original');
      fireEvent.click(externalLinks[0]);
      
      expect(window.electronAPI.openExternal).toHaveBeenCalledWith('https://cnn.com/story1');
    });

    test('shows loading state', () => {
      const mockOnBack = jest.fn();

      render(
        <StoryScreen story={null} onBack={mockOnBack} />
      );

      expect(screen.getByText('Loading story...')).toBeInTheDocument();
    });
  });

  describe('SettingsScreen', () => {
    test('renders settings form', async () => {
      const mockOnBack = jest.fn();

      render(
        <SettingsScreen onBack={mockOnBack} />
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('🔄 News Refresh Settings')).toBeInTheDocument();
      expect(screen.getByText('🔔 Notifications')).toBeInTheDocument();
      expect(screen.getByText('🖥️ Desktop Behavior')).toBeInTheDocument();
      expect(screen.getByText('🎨 Appearance')).toBeInTheDocument();
      expect(screen.getByText('📊 Application Info')).toBeInTheDocument();

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('12h')).toBeInTheDocument();
      });
    });

    test('handles refresh interval change', async () => {
      const mockOnBack = jest.fn();

      render(
        <SettingsScreen onBack={mockOnBack} />
      );

      await waitFor(() => {
        const oneHourOption = screen.getByDisplayValue('1h');
        fireEvent.click(oneHourOption);
      });

      await waitFor(() => {
        expect(window.electronAPI.saveSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            refreshInterval: '1h'
          })
        );
      });
    });

    test('handles manual refresh', async () => {
      const mockOnBack = jest.fn();

      render(
        <SettingsScreen onBack={mockOnBack} />
      );

      const refreshButton = screen.getByText('🔄 Refresh News Now');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(window.electronAPI.refreshNews).toHaveBeenCalled();
      });
    });

    test('displays app info', async () => {
      const mockOnBack = jest.fn();

      render(
        <SettingsScreen onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText('Version:')).toBeInTheDocument();
        expect(screen.getByText('v1.0.0')).toBeInTheDocument();
        expect(screen.getByText('Platform:')).toBeInTheDocument();
        expect(screen.getByText('Desktop')).toBeInTheDocument();
      });
    });

    test('handles utility buttons', async () => {
      const mockOnBack = jest.fn();

      render(
        <SettingsScreen onBack={mockOnBack} />
      );

      await waitFor(() => {
        const logsButton = screen.getByText('📋 View Logs');
        fireEvent.click(logsButton);
        expect(window.electronAPI.showLogs).toHaveBeenCalled();

        const aboutButton = screen.getByText('ℹ️ About');
        fireEvent.click(aboutButton);
        expect(window.electronAPI.showAbout).toHaveBeenCalled();
      });
    });
  });
});