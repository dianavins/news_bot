const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // News operations
  refreshNews: () => ipcRenderer.invoke('refresh-news'),
  getStories: (limit, offset) => ipcRenderer.invoke('get-stories', limit, offset),
  getStory: (storyId) => ipcRenderer.invoke('get-story', storyId),
  
  // Database operations
  getDatabaseStats: () => ipcRenderer.invoke('get-database-stats'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // External operations
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showLogs: () => ipcRenderer.invoke('show-logs'),
  showAbout: () => ipcRenderer.invoke('show-about'),
  
  // Listen to main process messages
  onNavigateToSettings: (callback) => ipcRenderer.on('navigate-to-settings', callback),
  onRefreshNews: (callback) => ipcRenderer.on('refresh-news', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  
  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

console.log('🔐 Preload script loaded - contextBridge configured');