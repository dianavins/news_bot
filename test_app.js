// Simple test script to verify app loading
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🧪 Starting App Tests...\n');
  
  // Test 1: Check if HTML file exists and is readable
  const htmlPath = path.join(__dirname, 'lite/src/web/static/index.html');
  console.log('Test 1: HTML File Check');
  console.log('HTML Path:', htmlPath);
  
  try {
    const htmlExists = fs.existsSync(htmlPath);
    console.log('✅ HTML exists:', htmlExists);
    
    if (htmlExists) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      console.log('✅ HTML size:', htmlContent.length, 'characters');
      console.log('✅ Contains CSS link:', htmlContent.includes('styles.css'));
      console.log('✅ Contains JS script:', htmlContent.includes('app.js'));
      console.log('✅ Contains VIEW NEWS button:', htmlContent.includes('VIEW THE NEWS'));
    }
  } catch (error) {
    console.log('❌ HTML file error:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: Check if CSS file exists
  const cssPath = path.join(__dirname, 'lite/src/web/static/styles.css');
  console.log('Test 2: CSS File Check');
  console.log('CSS Path:', cssPath);
  
  try {
    const cssExists = fs.existsSync(cssPath);
    console.log('✅ CSS exists:', cssExists);
    
    if (cssExists) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      console.log('✅ CSS size:', cssContent.length, 'characters');
      console.log('✅ Contains background color:', cssContent.includes('#f4f1eb'));
      console.log('✅ Contains screen classes:', cssContent.includes('.screen'));
    }
  } catch (error) {
    console.log('❌ CSS file error:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Check if JS file exists
  const jsPath = path.join(__dirname, 'lite/src/web/static/app.js');
  console.log('Test 3: JavaScript File Check');
  console.log('JS Path:', jsPath);
  
  try {
    const jsExists = fs.existsSync(jsPath);
    console.log('✅ JS exists:', jsExists);
    
    if (jsExists) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      console.log('✅ JS size:', jsContent.length, 'characters');
      console.log('✅ Contains button handler:', jsContent.includes('view-news-btn'));
      console.log('✅ Contains screen switching:', jsContent.includes('stories-screen'));
    }
  } catch (error) {
    console.log('❌ JS file error:', error.message);
  }
  
  console.log('\n🧪 File Tests Complete\n');
}

app.whenReady().then(async () => {
  await runTests();
  
  // Create test window
  const testWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  const htmlPath = path.join(__dirname, 'lite/src/web/static/index.html');
  await testWindow.loadFile(htmlPath);
  
  // Test what actually loaded
  setTimeout(async () => {
    console.log('🔍 Runtime Tests:');
    
    const title = await testWindow.webContents.executeJavaScript('document.title');
    console.log('✅ Page title:', title);
    
    const backgroundColor = await testWindow.webContents.executeJavaScript(`
      window.getComputedStyle(document.body).backgroundColor
    `);
    console.log('✅ Body background:', backgroundColor);
    
    const buttonExists = await testWindow.webContents.executeJavaScript(`
      document.getElementById('view-news-btn') !== null
    `);
    console.log('✅ VIEW NEWS button exists:', buttonExists);
    
    const screenCount = await testWindow.webContents.executeJavaScript(`
      document.querySelectorAll('.screen').length
    `);
    console.log('✅ Screen elements found:', screenCount);
    
    const activeScreen = await testWindow.webContents.executeJavaScript(`
      document.querySelector('.screen.active') ? document.querySelector('.screen.active').id : 'none'
    `);
    console.log('✅ Active screen:', activeScreen);
    
    console.log('\n🎯 Tests complete - check results above');
    
  }, 2000);
});

app.on('window-all-closed', () => {
  app.quit();
});