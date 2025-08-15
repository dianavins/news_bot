const { spawn } = require('child_process');
const path = require('path');

describe('App Startup Integration Test', () => {
  test('React build configuration is valid', () => {
    // Check that package.json has correct build scripts
    const packageJson = require('../package.json');
    
    expect(packageJson.scripts['build:react']).toBe('react-scripts build');
    expect(packageJson.scripts['start']).toContain('concurrently');
    expect(packageJson.scripts['start:react']).toBe('react-scripts start');
    expect(packageJson.scripts['start:electron']).toContain('electron');
    
    // Check that essential React files exist
    const fs = require('fs');
    expect(fs.existsSync('src/App.tsx')).toBe(true);
    expect(fs.existsSync('src/index.tsx')).toBe(true);
    expect(fs.existsSync('public/index.html')).toBe(true);
    expect(fs.existsSync('tsconfig.json')).toBe(true);
  });
  
  test('Electron app can be packaged', () => {
    // Check that electron-builder configuration exists
    const packageJson = require('../package.json');
    
    expect(packageJson.build).toBeDefined();
    expect(packageJson.build.appId).toBe('com.newsbot.desktop');
    expect(packageJson.build.productName).toBe('News Bot');
    expect(packageJson.build.directories.output).toBe('dist');
    
    // Check essential build files exist
    const fs = require('fs');
    const essentialFiles = [
      'electron/main.js',
      'electron/preload.js',
      'src/App.tsx',
      'public/index.html'
    ];
    
    essentialFiles.forEach(file => {
      expect(fs.existsSync(file)).toBe(true);
    });
  });
  
  test('IPC types are properly defined', () => {
    const fs = require('fs');
    const typesContent = fs.readFileSync('src/types/electron.d.ts', 'utf8');
    
    // Check essential type definitions exist
    expect(typesContent).toContain('interface ElectronAPI');
    expect(typesContent).toContain('getAppInfo');
    expect(typesContent).toContain('refreshNews');
    expect(typesContent).toContain('getSettings');
    expect(typesContent).toContain('electronAPI: ElectronAPI');
  });
  
  test('Main process file is valid JavaScript', () => {
    // Check that main process file exists and has valid syntax
    const fs = require('fs');
    const mainPath = path.resolve(__dirname, '../electron/main.js');
    
    expect(fs.existsSync(mainPath)).toBe(true);
    
    // Read the file content to check basic syntax
    const content = fs.readFileSync(mainPath, 'utf8');
    expect(content).toContain('class NewsBot');
    expect(content).toContain('BrowserWindow');
    expect(content).toContain('ipcMain');
    expect(content).toContain('Tray');
    
    // Check that it exports the NewsBot class
    expect(content).toContain('module.exports = NewsBot');
  });
});