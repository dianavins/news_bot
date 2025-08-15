// macOS notarization script for Electron Builder
// This script handles code signing and notarization for macOS builds

const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only run on macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip if environment variables not set (development builds)
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASS) {
    console.log('⚠️  Skipping notarization - APPLE_ID or APPLE_ID_PASS not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`🍎 Notarizing ${appName}...`);

  try {
    await notarize({
      appBundleId: 'com.newsbot.desktop',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASS,
      teamId: process.env.APPLE_TEAM_ID,
    });
    
    console.log('✅ Notarization complete');
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    throw error;
  }
};