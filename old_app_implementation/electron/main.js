const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
const path = require('path');
const DatabaseService = require('../src/services/database');

class NewsBot {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
    this.database = new DatabaseService();
    
    // Window configuration - force position and visibility
    this.windowConfig = {
      width: 900,
      height: 700,
      minWidth: 600,
      minHeight: 500,
      show: true, // Show immediately
      x: 100, // Force position on screen
      y: 100,
      center: true, // Center the window
      alwaysOnTop: false, // Remove always on top
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: false, // Allow local file loading
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      icon: path.join(__dirname, '../assets/icon.png') // TODO: Add icon
    };
  }

  async initialize() {
    console.log('🚀 Initializing News Bot Desktop App...');
    
    // Handle app events
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', this.onBeforeQuit.bind(this));
    
    // Security: Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });
    });
  }

  async initializeDatabase() {
    console.log('🗄️ Initializing database...');
    
    try {
      await this.database.initialize();
      
      // Check if we need to migrate data from lite version
      const stats = this.database.getStats();
      console.log(`📊 Database stats: ${stats.articles} articles, ${stats.stories} stories`);
      
      // If database is empty, try to copy from lite version
      if (stats.articles === 0 && stats.stories === 0) {
        const liteDbPath = path.join(__dirname, '../lite/data/news.db');
        const fs = require('fs');
        
        if (fs.existsSync(liteDbPath)) {
          console.log('🔄 Migrating data from lite version...');
          const migrationResult = await this.database.copyFromLiteDatabase(liteDbPath);
          console.log(`✅ Migrated ${migrationResult.articles} articles and ${migrationResult.stories} stories`);
        } else {
          console.log('ℹ️ No lite database found, starting with empty database');
        }
      }
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      // Don't crash the app, but log the error
      dialog.showErrorBox('Database Error', `Failed to initialize database: ${error.message}`);
    }
  }

  async onReady() {
    console.log('📱 App ready, initializing services...');
    
    // Initialize database first
    await this.initializeDatabase();
    
    // Create main window
    await this.createMainWindow();
    
    // Set up system tray - disabled for now to prevent window hiding issues
    // await this.createSystemTray();
    
    // Set up application menu
    this.createApplicationMenu();
    
    // Set up IPC handlers
    this.setupIPC();
    
    // Initialize auto-updater in production
    if (!isDev) {
      this.setupAutoUpdater();
    }
    
    console.log('✅ News Bot Desktop App initialized successfully');
  }

  async createMainWindow() {
    console.log('🪟 Creating browser window with config:', this.windowConfig);
    
    // Create the browser window
    this.mainWindow = new BrowserWindow(this.windowConfig);
    
    console.log('🪟 Window created, bounds:', this.mainWindow.getBounds());
    console.log('🪟 Window visible:', this.mainWindow.isVisible());
    console.log('🪟 Window minimized:', this.mainWindow.isMinimized());
    
    // Load the app - force production mode for now
    const startUrl = `file://${path.join(__dirname, '../build/index.html')}`;
    console.log('🌐 Loading URL:', startUrl);
    
    await this.mainWindow.loadURL(startUrl);
    
    console.log('🌐 URL loaded, window still visible:', this.mainWindow.isVisible());
    
    // Force window to front
    this.mainWindow.focus();
    this.mainWindow.show(); // Force show again
    console.log('🎯 Window focused and shown');
    
    // Open DevTools to debug blank page
    this.mainWindow.webContents.openDevTools();
    
    // Log any console errors
    this.mainWindow.webContents.on('console-message', (event, level, message) => {
      console.log('Browser Console:', level, message);
    });
    
    // Handle window events
    this.mainWindow.on('ready-to-show', () => {
      console.log('🎨 Window ready to show');
      this.mainWindow.show();
      
      // Focus window on first run
      if (isDev) {
        this.mainWindow.focus();
      }
    });
    
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
    
    // Handle minimize to tray
    this.mainWindow.on('minimize', (event) => {
      if (this.tray) {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });
    
    // Normal close behavior since no system tray
    this.mainWindow.on('close', () => {
      this.mainWindow = null;
    });
    
    console.log('🪟 Main window created and configured');
  }

  async createSystemTray() {
    // TODO: Add proper tray icon
    const trayIconPath = path.join(__dirname, '../assets/tray-icon.png');
    
    // Create tray (will implement icon later)
    this.tray = new Tray(trayIconPath);
    
    // Set up context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show News Bot',
        click: () => {
          this.showWindow();
        }
      },
      {
        label: 'Refresh News',
        click: () => {
          this.refreshNews();
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          this.showSettings();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.quitApp();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('News Bot - Anti-Echo Chamber News');
    
    // Handle tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });
    
    console.log('🖱️ System tray created');
  }

  createApplicationMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Refresh News',
            accelerator: 'CmdOrCtrl+R',
            click: () => this.refreshNews()
          },
          { type: 'separator' },
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.showSettings()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => this.quitApp()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
    console.log('📋 Application menu created');
  }

  setupIPC() {
    // Handle app info requests
    ipcMain.handle('get-app-info', () => {
      const dbStats = this.database.getStats();
      return {
        version: app.getVersion(),
        platform: process.platform,
        isDev: isDev,
        electronVersion: process.versions.electron,
        database: dbStats
      };
    });
    
    // Handle window controls
    ipcMain.handle('minimize-window', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize();
      }
    });
    
    ipcMain.handle('close-window', () => {
      if (this.mainWindow) {
        this.mainWindow.close();
      }
    });
    
    // Handle news operations
    ipcMain.handle('refresh-news', async () => {
      return await this.refreshNews();
    });

    ipcMain.handle('get-stories', async (event, limit = 10, offset = 0) => {
      try {
        const stories = this.database.getStories(limit, offset);
        console.log(`📰 Retrieved ${stories.length} stories for UI`);
        return stories;
      } catch (error) {
        console.error('Error getting stories:', error);
        return [];
      }
    });

    ipcMain.handle('get-story', async (event, storyId) => {
      try {
        const story = this.database.getStory(storyId);
        console.log(`📖 Retrieved story: ${story ? story.title : 'Not found'}`);
        return story;
      } catch (error) {
        console.error('Error getting story:', error);
        return null;
      }
    });

    ipcMain.handle('get-database-stats', async () => {
      try {
        return this.database.getStats();
      } catch (error) {
        console.error('Error getting database stats:', error);
        return { error: error.message };
      }
    });
    
    // Handle settings
    ipcMain.handle('get-settings', async () => {
      // TODO: Implement persistent settings storage
      return {
        refreshInterval: '12h',
        notifications: true,
        minimizeToTray: true,
        autoStart: false,
        theme: 'light'
      };
    });
    
    ipcMain.handle('save-settings', async (event, settings) => {
      // TODO: Implement persistent settings storage
      console.log('💾 Saving settings:', settings);
      return { success: true };
    });

    // Handle external operations
    ipcMain.handle('open-external', async (event, url) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        console.error('Error opening external URL:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('show-logs', async () => {
      // TODO: Implement log viewer
      console.log('📋 Opening logs...');
      return { success: true };
    });

    ipcMain.handle('show-about', async () => {
      const aboutInfo = {
        name: 'News Bot',
        version: app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
      };
      
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'About News Bot',
        message: 'News Bot Desktop',
        detail: `Version: ${aboutInfo.version}\nElectron: ${aboutInfo.electron}\nNode: ${aboutInfo.node}\nChrome: ${aboutInfo.chrome}\n\nAnti-Echo Chamber News Aggregation`
      });
      
      return { success: true };
    });
    
    console.log('🔗 IPC handlers set up');
  }

  setupAutoUpdater() {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      console.log('🔄 Update available');
    });
    
    autoUpdater.on('update-downloaded', () => {
      console.log('⬇️ Update downloaded');
    });
  }

  // Window management methods
  showWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  hideWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  toggleWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.hideWindow();
      } else {
        this.showWindow();
      }
    }
  }

  showSettings() {
    // Send message to renderer to show settings
    if (this.mainWindow) {
      this.mainWindow.webContents.send('navigate-to-settings');
      this.showWindow();
    }
  }

  async refreshNews() {
    console.log('🔄 Refreshing news...');
    // TODO: Implement news refresh logic
    if (this.mainWindow) {
      this.mainWindow.webContents.send('refresh-news');
    }
    return { success: true, message: 'News refresh initiated' };
  }

  quitApp() {
    this.isQuitting = true;
    app.quit();
  }

  // App event handlers
  onWindowAllClosed() {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  onActivate() {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }

  onBeforeQuit() {
    this.isQuitting = true;
  }
}

// Create and initialize the app
const newsBot = new NewsBot();
newsBot.initialize();

// Export for testing
module.exports = NewsBot;