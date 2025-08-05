const fs = require('fs');
const path = require('path');

describe('Project Structure Tests', () => {
  test('package.json has correct dependencies', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check core dependencies
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('electron-is-dev');
    expect(packageJson.dependencies).toHaveProperty('better-sqlite3');
    expect(packageJson.dependencies).toHaveProperty('rss-parser');
    
    // Check dev dependencies
    expect(packageJson.devDependencies).toHaveProperty('electron');
    expect(packageJson.devDependencies).toHaveProperty('electron-builder');
    expect(packageJson.devDependencies).toHaveProperty('typescript');
    
    // Check scripts
    expect(packageJson.scripts).toHaveProperty('start');
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts).toHaveProperty('dist');
  });

  test('essential directories exist', () => {
    const requiredDirs = [
      'src',
      'public',
      'electron',
      'lite',
      'lite/src',
      'lite/data'
    ];
    
    requiredDirs.forEach(dir => {
      expect(fs.existsSync(dir)).toBe(true);
    });
  });

  test('essential files exist', () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'src/App.tsx',
      'src/index.tsx',
      'public/index.html',
      'lite/run_server.py',
      'lite/config.py'
    ];
    
    requiredFiles.forEach(file => {
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  test('lite version has working database', () => {
    expect(fs.existsSync('lite/data/news.db')).toBe(true);
    
    // Check file size (should not be empty)
    const stats = fs.statSync('lite/data/news.db');
    expect(stats.size).toBeGreaterThan(0);
  });

  test('TypeScript configuration is valid', () => {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    expect(tsConfig.compilerOptions).toHaveProperty('target');
    expect(tsConfig.compilerOptions).toHaveProperty('jsx');
    expect(tsConfig.compilerOptions.jsx).toBe('react-jsx');
    expect(tsConfig.include).toContain('src');
  });
});