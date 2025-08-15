// Unit test for system tray functionality
const { app, BrowserWindow, Tray } = require('electron');
const path = require('path');
const fs = require('fs');

async function testTrayFunctionality() {
  console.log('🧪 Starting tray functionality tests...\n');
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  function test(name, condition) {
    testResults.total++;
    if (condition) {
      console.log(`✅ ${name}`);
      testResults.passed++;
    } else {
      console.log(`❌ ${name}`);
      testResults.failed++;
    }
  }
  
  // Test 1: Check if tray icon file exists
  const trayIconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
  test('Tray icon file exists', fs.existsSync(trayIconPath));
  
  // Test 2: Check icon file size (should be > 0)
  let iconSize = 0;
  try {
    const stats = fs.statSync(trayIconPath);
    iconSize = stats.size;
  } catch (error) {
    // File doesn't exist
  }
  test('Tray icon has valid size', iconSize > 0);
  
  // Test 3: Check if we can read the icon file
  let canReadIcon = false;
  try {
    fs.readFileSync(trayIconPath);
    canReadIcon = true;
  } catch (error) {
    canReadIcon = false;
  }
  test('Tray icon is readable', canReadIcon);
  
  // Print results
  console.log(`\n📊 Test Results: ${testResults.passed}/${testResults.total} passed`);
  if (testResults.failed > 0) {
    console.log(`❌ ${testResults.failed} tests failed`);
    return false;
  } else {
    console.log('✅ All tests passed!');
    return true;
  }
}

if (require.main === module) {
  testTrayFunctionality().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testTrayFunctionality };