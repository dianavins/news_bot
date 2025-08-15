const path = require('path');
const { Application } = require('spectron');

// Mock Electron for unit testing
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    getName: jest.fn(() => 'News Bot'),
    getVersion: jest.fn(() => '1.0.0'),
    getPath: jest.fn(() => require('path').join(__dirname, '../test-data')),
    quit: jest.fn()
  },
  BrowserWindow: jest.fn(() => ({
    loadURL: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    minimize: jest.fn(),
    close: jest.fn(),
    focus: jest.fn(),
    isVisible: jest.fn(() => true),
    isMinimized: jest.fn(() => false),
    restore: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn()
    }
  })),
  Menu: {
    buildFromTemplate: jest.fn(() => ({})),
    setApplicationMenu: jest.fn()
  },
  Tray: jest.fn(() => ({
    setContextMenu: jest.fn(),
    setToolTip: jest.fn(),
    on: jest.fn()
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {},
  shell: {
    openExternal: jest.fn()
  }
}));

jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(),
    on: jest.fn()
  }
}));

jest.mock('electron-is-dev', () => true);

describe('Electron Main Process', () => {
  let NewsBot;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the module to get fresh instance
    delete require.cache[path.resolve(__dirname, '../electron/main.js')];
    NewsBot = require('../electron/main.js');
  });

  test('NewsBot class can be instantiated', () => {
    const newsBot = new NewsBot();
    expect(newsBot).toBeInstanceOf(NewsBot);
    expect(newsBot.mainWindow).toBeNull();
    expect(newsBot.tray).toBeNull();
    expect(newsBot.isQuitting).toBe(false);
  });

  test('window configuration has correct properties', () => {
    const newsBot = new NewsBot();
    
    expect(newsBot.windowConfig).toHaveProperty('width', 900);
    expect(newsBot.windowConfig).toHaveProperty('height', 700);
    expect(newsBot.windowConfig).toHaveProperty('minWidth', 600);
    expect(newsBot.windowConfig).toHaveProperty('minHeight', 500);
    expect(newsBot.windowConfig.show).toBe(false);
    expect(newsBot.windowConfig.webPreferences.nodeIntegration).toBe(false);
    expect(newsBot.windowConfig.webPreferences.contextIsolation).toBe(true);
  });

  test('initialize method sets up app event listeners', async () => {
    const { app } = require('electron');
    const newsBot = new NewsBot();
    
    await newsBot.initialize();
    
    expect(app.whenReady).toHaveBeenCalled();
    expect(app.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
    expect(app.on).toHaveBeenCalledWith('activate', expect.any(Function));
    expect(app.on).toHaveBeenCalledWith('before-quit', expect.any(Function));
    expect(app.on).toHaveBeenCalledWith('web-contents-created', expect.any(Function));
  });

  test('createMainWindow creates BrowserWindow with correct config', async () => {
    const { BrowserWindow } = require('electron');
    const newsBot = new NewsBot();
    
    await newsBot.createMainWindow();
    
    expect(BrowserWindow).toHaveBeenCalledWith(newsBot.windowConfig);
    expect(newsBot.mainWindow).toBeTruthy();
  });

  test('window management methods work correctly', () => {
    const newsBot = new NewsBot();
    const mockWindow = {
      isMinimized: jest.fn(() => false),
      restore: jest.fn(),
      show: jest.fn(),
      focus: jest.fn(),
      hide: jest.fn(),
      isVisible: jest.fn(() => true)
    };
    newsBot.mainWindow = mockWindow;
    
    // Test showWindow
    newsBot.showWindow();
    expect(mockWindow.show).toHaveBeenCalled();
    expect(mockWindow.focus).toHaveBeenCalled();
    
    // Test hideWindow
    newsBot.hideWindow();
    expect(mockWindow.hide).toHaveBeenCalled();
    
    // Test toggleWindow when visible
    newsBot.toggleWindow();
    expect(mockWindow.hide).toHaveBeenCalledTimes(2); // Called twice now
  });

  test('IPC handlers are set up correctly', () => {
    const { ipcMain } = require('electron');
    const newsBot = new NewsBot();
    
    newsBot.setupIPC();
    
    // Check that IPC handlers were registered
    expect(ipcMain.handle).toHaveBeenCalledWith('get-app-info', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('minimize-window', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('close-window', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('refresh-news', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('get-settings', expect.any(Function));
    expect(ipcMain.handle).toHaveBeenCalledWith('save-settings', expect.any(Function));
  });

  test('system tray is created with correct menu', async () => {
    const { Tray, Menu } = require('electron');
    const newsBot = new NewsBot();
    
    await newsBot.createSystemTray();
    
    expect(Tray).toHaveBeenCalled();
    expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Show News Bot' }),
        expect.objectContaining({ label: 'Refresh News' }),
        expect.objectContaining({ label: 'Settings' }),
        expect.objectContaining({ label: 'Quit' })
      ])
    );
  });

  test('refreshNews method works correctly', async () => {
    const newsBot = new NewsBot();
    const mockWindow = {
      webContents: {
        send: jest.fn()
      }
    };
    newsBot.mainWindow = mockWindow;
    
    const result = await newsBot.refreshNews();
    
    expect(result).toEqual({ success: true, message: 'News refresh initiated' });
    expect(mockWindow.webContents.send).toHaveBeenCalledWith('refresh-news');
  });

  test('quitApp sets isQuitting flag and calls app.quit', () => {
    const { app } = require('electron');
    const newsBot = new NewsBot();
    
    newsBot.quitApp();
    
    expect(newsBot.isQuitting).toBe(true);
    expect(app.quit).toHaveBeenCalled();
  });
});