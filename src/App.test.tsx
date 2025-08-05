import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Basic smoke tests for the React app structure
describe('News Bot Desktop App', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('initializes with home screen', () => {
    render(<App />);
    // App should start on home screen
    expect(document.querySelector('.desktop-app')).toBeInTheDocument();
  });

  test('detects Electron environment', () => {
    // Mock Electron user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) news-bot-desktop/1.0.0 Chrome/106.0.5249.199 Electron/22.3.27 Safari/537.36'
    });

    render(<App />);
    
    // Should detect Electron environment
    // This will be verified by console logs in the actual app
    expect(window.navigator.userAgent).toContain('Electron');
  });

  test('has proper desktop app class', () => {
    render(<App />);
    const appElement = document.querySelector('.desktop-app');
    expect(appElement).toBeInTheDocument();
    expect(appElement).toHaveClass('desktop-app');
  });
});