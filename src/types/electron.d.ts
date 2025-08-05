// Type definitions for Electron API exposed through preload script

export interface ElectronAPI {
  // App info
  getAppInfo: () => Promise<{
    version: string;
    platform: string;
    isDev: boolean;
    electronVersion?: string;
  }>;
  
  // Window controls
  minimizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // News operations
  refreshNews: () => Promise<{
    success: boolean;
    message: string;
  }>;
  getStories: () => Promise<any[]>;
  getStory: (id: string) => Promise<any>;
  
  // Settings
  getSettings: () => Promise<{
    refreshInterval: string;
    notifications: boolean;
    minimizeToTray?: boolean;
    autoStart?: boolean;
    theme?: 'light' | 'dark' | 'system';
  }>;
  saveSettings: (settings: {
    refreshInterval?: string;
    notifications?: boolean;
    minimizeToTray?: boolean;
    autoStart?: boolean;
    theme?: 'light' | 'dark' | 'system';
  }) => Promise<{ success: boolean }>;
  
  // External operations
  openExternal: (url: string) => Promise<void>;
  showLogs: () => Promise<void>;
  showAbout: () => Promise<void>;
  
  // Event listeners
  onNavigateToSettings: (callback: () => void) => void;
  onRefreshNews: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  
  // Platform info
  platform: string;
  
  // Version info
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}