const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
const path = require('path');

class NewsBot {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
    
    // Window configuration
    this.windowConfig = {
      width: 900,
      height: 700,
      minWidth: 600,
      minHeight: 500,
      show: false, // Don't show until ready
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
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

  async onReady() {
    console.log('📱 App ready, creating main window...');
    
    // Create main window
    await this.createMainWindow();
    
    // Set up system tray
    await this.createSystemTray();
    
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
    // Create the browser window
    this.mainWindow = new BrowserWindow(this.windowConfig);
    
    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    await this.mainWindow.loadURL(startUrl);
    
    // Open DevTools in development
    if (isDev) {
      this.mainWindow.webContents.openDevTools();
    }
    
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
    
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && this.tray) {
        event.preventDefault();
        this.mainWindow.hide();
        return false;
      }
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
      return {
        version: app.getVersion(),
        platform: process.platform,
        isDev: isDev
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
    
    // Handle news refresh
    ipcMain.handle('refresh-news', async () => {
      return await this.refreshNews();
    });
    
    // Handle settings
    ipcMain.handle('get-settings', async () => {
      // TODO: Implement settings storage
      return {
        refreshInterval: '12h',
        notifications: true
      };
    });
    
    ipcMain.handle('save-settings', async (event, settings) => {
      // TODO: Implement settings storage
      console.log('💾 Saving settings:', settings);
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