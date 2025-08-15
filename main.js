const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow;
let db;
let tray;
let isQuitting = false;
let refreshTimer = null;
let currentSettings = { refreshInterval: '12h' };
let popupWindow = null;
let latestNewStories = [];

// Database helper functions
function initializeDatabase() {
  try {
    const dbPath = path.join(__dirname, 'lite', 'data', 'news.db');
    console.log('📁 Database path:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}`);
    }
    
    db = new Database(dbPath, { readonly: true });
    // Skip WAL mode pragma for readonly database
    
    const articlesCount = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    const storiesCount = db.prepare('SELECT COUNT(*) as count FROM stories').get();
    
    console.log('✅ Database initialized:', {
      articles: articlesCount.count,
      stories: storiesCount.count
    });
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

function getStories() {
  try {
    console.log('🔍 Getting stories, db status:', !!db);
    if (!db) {
      console.log('❌ Database not initialized');
      return [];
    }
    
    const stmt = db.prepare(`
      SELECT 
        id,
        event_headline as title,
        unified_summary,
        created_date
      FROM stories 
      ORDER BY created_date DESC
      LIMIT 10
    `);
    
    const stories = stmt.all();
    console.log('📚 Found stories:', stories.length);
    console.log('📚 First story:', stories[0]);
    
    const mapped = stories.map((story, index) => {
      // Get references for this story to create subtitle from sources
      let subtitle = 'Multiple sources';
      try {
        const stmt = db.prepare('SELECT references_json FROM stories WHERE id = ?');
        const storyWithRefs = stmt.get(story.id);
        if (storyWithRefs && storyWithRefs.references_json) {
          const references = JSON.parse(storyWithRefs.references_json);
          if (references && references.length > 0) {
            const sources = references.map(ref => ref.source).filter(Boolean);
            // Remove duplicates
            const uniqueSources = [...new Set(sources)];
            if (uniqueSources.length > 0) {
              if (uniqueSources.length <= 3) {
                subtitle = uniqueSources.join(', ');
              } else {
                subtitle = uniqueSources.slice(0, 2).join(', ') + ` and ${uniqueSources.length - 2} other sources`;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error creating subtitle from sources:', error);
        // Fallback to first sentence
        const firstSentence = story.unified_summary.split(/[.!?]+/)[0];
        if (firstSentence && firstSentence.length > 0 && firstSentence.length < 200) {
          subtitle = firstSentence.trim() + '.';
        } else {
          subtitle = story.unified_summary.substring(0, 150).trim() + '...';
        }
      }
      
      return {
        id: story.id,
        title: story.title,
        subtitle: subtitle,
        number: index + 1
      };
    });
    
    console.log('📚 Mapped stories:', mapped.length);
    return mapped;
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

function getStoryDetails(storyId) {
  try {
    const stmt = db.prepare(`
      SELECT 
        id,
        event_headline as title,
        unified_summary as subtitle,
        unified_summary,
        background_context,
        economic_impact,
        social_values,
        practical_solutions,
        conservative_view,
        progressive_view,
        references_json
      FROM stories 
      WHERE id = ?
    `);
    
    const story = stmt.get(storyId);
    
    if (!story) {
      return null;
    }
    
    // Parse JSON fields that are stored as TEXT in SQLite
    let backgroundContext, economicImpact, socialValues, practicalSolutions;
    let references = [];
    
    try {
      backgroundContext = JSON.parse(story.background_context);
    } catch {
      backgroundContext = { bullets: [story.background_context] };
    }
    
    try {
      economicImpact = JSON.parse(story.economic_impact);
    } catch {
      economicImpact = { bullets: [story.economic_impact] };
    }
    
    try {
      socialValues = JSON.parse(story.social_values);
    } catch {
      socialValues = { bullets: [story.social_values] };
    }
    
    try {
      practicalSolutions = JSON.parse(story.practical_solutions);
    } catch {
      practicalSolutions = { bullets: [story.practical_solutions] };
    }
    
    try {
      references = JSON.parse(story.references_json || '[]');
    } catch {
      references = [];
    }
    
    // Create subtitle from sources
    let shortSubtitle = 'Multiple sources';
    if (references && references.length > 0) {
      const sources = references.map(ref => ref.source).filter(Boolean);
      // Remove duplicates
      const uniqueSources = [...new Set(sources)];
      if (uniqueSources.length > 0) {
        if (uniqueSources.length <= 3) {
          shortSubtitle = uniqueSources.join(', ');
        } else {
          shortSubtitle = uniqueSources.slice(0, 2).join(', ') + ` and ${uniqueSources.length - 2} other sources`;
        }
      }
    }

    return {
      id: story.id,
      title: story.title,
      subtitle: shortSubtitle,
      number: 1,
      unified_summary: story.unified_summary,
      background_context: backgroundContext,
      economic_impact: economicImpact,
      social_values: socialValues,
      practical_solutions: practicalSolutions,
      political_perspectives: {
        conservative: story.conservative_view,
        progressive: story.progressive_view
      },
      references: references
    };
  } catch (error) {
    console.error('Error fetching story details:', error);
    return null;
  }
}

function createTray() {
  try {
    console.log('🖼️ Creating system tray...');
    
    // Try multiple icon approaches
    let trayIconPath = path.join(__dirname, 'desktop', 'assets', 'tray-icon.png');
    console.log('🖼️ Tray icon path:', trayIconPath);
    
    // Fallback to native icon if PNG fails
    if (!fs.existsSync(trayIconPath)) {
      console.log('⚠️ PNG icon not found, using native icon fallback');
      // Use a simple native icon approach
      trayIconPath = path.join(__dirname, 'desktop', 'assets', 'tray-icon.ico');
      if (!fs.existsSync(trayIconPath)) {
        console.log('⚠️ No icon files found, creating simple fallback');
        // Skip tray for now - we'll add this later
        return false;
      }
    }
    
    tray = new Tray(trayIconPath);
    tray.setToolTip('CommonGround - Running in background');
    
    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show CommonGround',
        click: () => {
          console.log('📱 Tray: Show window requested');
          showWindow();
        }
      },
      {
        label: 'Check for Updates',
        click: () => {
          console.log('🔄 Tray: Manual refresh requested');
          performBackgroundRefresh().then(() => {
            console.log('✅ Tray manual refresh completed');
          }).catch(error => {
            console.error('❌ Tray manual refresh failed:', error);
          });
        }
      },
      { type: 'separator' },
      {
        label: 'Quit CommonGround',
        click: () => {
          console.log('🚪 Tray: Quit requested');
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    
    // Handle tray click (show/hide window)
    tray.on('click', () => {
      console.log('🖱️ Tray clicked');
      if (mainWindow.isVisible()) {
        hideWindow();
      } else {
        showWindow();
      }
    });
    
    console.log('✅ System tray created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create system tray:', error);
    return false;
  }
}

function showWindow() {
  if (mainWindow) {
    console.log('👁️ Showing main window');
    mainWindow.show();
    mainWindow.focus();
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  }
}

function hideWindow() {
  if (mainWindow) {
    console.log('🙈 Hiding main window');
    mainWindow.hide();
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
  }
}

function createWindow() {
  // Create simple browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true, // Hide menu bar
    webPreferences: {
      webSecurity: false, // Allow local file loading
      nodeIntegration: false, // Disable for security
      contextIsolation: true, // Enable for security
      preload: path.join(__dirname, 'desktop', 'preload.js')
    }
  });

  // Load the fixed HTML file with correct paths
  const htmlPath = path.join(__dirname, 'index.html');
  console.log('Loading HTML from:', htmlPath);
  
  mainWindow.loadFile(htmlPath);

  // Open DevTools to debug if needed
  mainWindow.webContents.openDevTools();

  // Change close behavior: hide instead of quit (unless explicitly quitting)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      console.log('🚪 Window close intercepted - hiding instead of quitting');
      event.preventDefault();
      hideWindow();
      return false;
    } else {
      console.log('🚪 Window closing normally - app is quitting');
    }
  });

  mainWindow.on('closed', () => {
    console.log('🚪 Window closed');
    mainWindow = null;
  });

  console.log('✅ Electron window created and loaded lite version');
}

app.whenReady().then(() => {
  // Initialize database first
  const dbSuccess = initializeDatabase();
  if (!dbSuccess) {
    console.error('Failed to initialize database. App may not function correctly.');
  }
  
  createWindow();
  
  // Initialize system tray
  const traySuccess = createTray();
  if (!traySuccess) {
    console.error('Failed to create system tray. App will still function but without tray integration.');
  }
  
  // Load settings and start refresh timer
  currentSettings = loadSettings();
  setupRefreshTimer();
  console.log('🔄 Background refresh system initialized');
});

app.on('window-all-closed', () => {
  // Don't quit when all windows are closed - keep running in tray
  // Only quit if explicitly requested
  if (isQuitting) {
    console.log('🚪 All windows closed and quitting requested');
    app.quit();
  } else {
    console.log('🙈 All windows closed but staying in tray');
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for database operations
ipcMain.handle('get-stories', async () => {
  console.log('🔌 IPC: get-stories called');
  const stories = getStories();
  console.log('🔌 IPC: returning', stories.length, 'stories');
  return stories;
});

ipcMain.handle('get-story', async (event, storyId) => {
  console.log('🔌 IPC: get-story called for ID:', storyId);
  const story = getStoryDetails(storyId);
  console.log('🔌 IPC: returning story:', !!story);
  return story;
});

// Settings persistence
const settingsPath = path.join(__dirname, 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // Default settings
  return {
    refreshInterval: '12h'
  };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('💾 Settings saved:', settings);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

ipcMain.handle('get-settings', async () => {
  console.log('🔌 IPC: get-settings called');
  const settings = loadSettings();
  console.log('🔌 IPC: returning settings:', settings);
  return settings;
});

ipcMain.handle('save-settings', async (event, newSettings) => {
  console.log('🔌 IPC: save-settings called with:', newSettings);
  const success = saveSettings(newSettings);
  
  // Update current settings and restart timer if interval changed
  if (success && newSettings.refreshInterval !== currentSettings.refreshInterval) {
    currentSettings = { ...currentSettings, ...newSettings };
    setupRefreshTimer();
    console.log('🔄 Refresh timer updated for new interval:', newSettings.refreshInterval);
  }
  
  return { success };
});

ipcMain.handle('manual-refresh', async () => {
  console.log('🔌 IPC: manual-refresh called');
  try {
    await performBackgroundRefresh();
    return { success: true, message: 'Manual refresh completed' };
  } catch (error) {
    console.error('Manual refresh failed:', error);
    return { success: false, message: error.message };
  }
});

// Background refresh system
const { spawn } = require('child_process');

function parseRefreshInterval(interval) {
  // Convert "12h" to milliseconds
  const match = interval.match(/(\d+)h?/);
  if (match) {
    const hours = parseInt(match[1]);
    return hours * 60 * 60 * 1000; // Convert to milliseconds
  }
  return 12 * 60 * 60 * 1000; // Default to 12 hours
}

function setupRefreshTimer() {
  // Clear existing timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
    console.log('🔄 Cleared previous refresh timer');
  }
  
  const intervalMs = parseRefreshInterval(currentSettings.refreshInterval);
  const intervalHours = intervalMs / (60 * 60 * 1000);
  
  console.log(`🔄 Setting up refresh timer for ${intervalHours} hours (${intervalMs}ms)`);
  
  refreshTimer = setInterval(() => {
    console.log(`🔄 Scheduled refresh triggered (${intervalHours}h interval)`);
    performBackgroundRefresh();
  }, intervalMs);
  
  console.log(`✅ Refresh timer active - next refresh in ${intervalHours} hours`);
}

async function performBackgroundRefresh() {
  try {
    console.log('🔄 Starting background refresh...');
    
    // Clear old stories before processing new ones
    clearOldStories();
    
    // Get story count before refresh (should be 0 after clearing)
    const beforeCount = getStoryCount();
    console.log(`📊 Stories before refresh: ${beforeCount}`);
    
    // Run data collection
    await runPythonScript('data/collector.py');
    
    // Run story processing
    await runPythonScript('synthesis/processor.py');
    
    // Get story count after refresh
    const afterCount = getStoryCount();
    console.log(`📊 Stories after refresh: ${afterCount}`);
    
    // Since we clear stories first, any stories found are "new"
    if (afterCount > 0) {
      console.log(`🎉 Found ${afterCount} new stories!`);
      
      // Get the new stories for popup display
      const allStories = getStories();
      latestNewStories = allStories.slice(0, Math.min(5, afterCount));
      
      // Show notification popup
      showNotificationPopup(afterCount);
      
      // Send update to renderer if window is open
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('stories-updated', { newCount: afterCount });
      }
    } else {
      console.log('📰 No new stories found');
    }
    
    console.log('✅ Background refresh completed');
    
  } catch (error) {
    console.error('❌ Background refresh failed:', error);
  }
}

function getStoryCount() {
  try {
    if (!db) return 0;
    const result = db.prepare('SELECT COUNT(*) as count FROM stories').get();
    return result.count;
  } catch (error) {
    console.error('Error getting story count:', error);
    return 0;
  }
}

function clearOldStories() {
  try {
    if (!db) {
      console.log('❌ No database connection for clearing stories');
      return;
    }
    
    const beforeCount = getStoryCount();
    console.log(`🗑️ Clearing ${beforeCount} old stories...`);
    
    // Delete all existing stories
    const deleteStories = db.prepare('DELETE FROM stories');
    const storiesResult = deleteStories.run();
    
    // Also clear old articles to keep database clean
    const deleteArticles = db.prepare('DELETE FROM articles');
    const articlesResult = deleteArticles.run();
    
    console.log(`✅ Cleared ${storiesResult.changes} stories and ${articlesResult.changes} articles`);
    
  } catch (error) {
    console.error('❌ Error clearing old stories:', error);
  }
}

function runPythonScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'lite', 'src', scriptName);
    const workingDir = path.join(__dirname, 'lite', 'src', path.dirname(scriptName));
    
    console.log(`🐍 Running Python script: ${scriptPath}`);
    console.log(`🐍 Working directory: ${workingDir}`);
    
    const pythonProcess = spawn('python', [path.basename(scriptPath)], {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONPATH: path.join(__dirname, 'lite') }
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        if (stdout) console.log(`📝 Output: ${stdout.trim()}`);
        resolve(stdout);
      } else {
        console.error(`❌ ${scriptName} failed with code ${code}`);
        if (stderr) console.error(`📝 Error: ${stderr.trim()}`);
        reject(new Error(`Python script failed: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error(`❌ Failed to start ${scriptName}:`, error);
      reject(error);
    });
  });
}

// Notification popup window
const { screen } = require('electron');

function showNotificationPopup(newCount) {
  try {
    console.log(`🔔 Showing notification popup for ${newCount} new stories`);
    
    // Close existing popup if any
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close();
    }
    
    // Get screen dimensions for positioning
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // Popup dimensions
    const popupWidth = 400;
    const popupHeight = 300;
    const margin = 20;
    
    // Calculate bottom-right position
    const x = screenWidth - popupWidth - margin;
    const y = screenHeight - popupHeight - margin;
    
    // Create popup window
    popupWindow = new BrowserWindow({
      width: popupWidth,
      height: popupHeight,
      x: x,
      y: y,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      transparent: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'desktop', 'popup-preload.js')
      }
    });
    
    // Load popup HTML
    popupWindow.loadFile(path.join(__dirname, 'desktop', 'popup.html'));
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (popupWindow && !popupWindow.isDestroyed()) {
        popupWindow.close();
        console.log('🔔 Popup auto-dismissed after 15 seconds');
      }
    }, 15000);
    
    // Handle popup closed
    popupWindow.on('closed', () => {
      popupWindow = null;
      console.log('🔔 Popup window closed');
    });
    
    console.log('✅ Notification popup displayed');
    
  } catch (error) {
    console.error('❌ Failed to show notification popup:', error);
  }
}

// IPC handlers for popup
ipcMain.handle('get-new-stories', () => {
  console.log('🔌 IPC: get-new-stories called from popup');
  return latestNewStories;
});

ipcMain.handle('open-main-window', () => {
  console.log('🔌 IPC: open-main-window called from popup');
  showWindow();
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
  }
});

// Clean up database and tray on app quit
app.on('before-quit', () => {
  console.log('🧹 Cleaning up before quit...');
  isQuitting = true;
  
  // Clear refresh timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
    console.log('🔄 Refresh timer cleared');
  }
  
  // Close popup if open
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
    console.log('🔔 Popup window closed');
  }
  
  if (db) {
    db.close();
    console.log('🗄️ Database connection closed');
  }
  
  if (tray) {
    tray.destroy();
    console.log('🗑️ System tray destroyed');
  }
});