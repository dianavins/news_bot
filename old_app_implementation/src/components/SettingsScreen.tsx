import React, { useState, useEffect } from 'react';

interface AppSettings {
  refreshInterval: string;
  notifications: boolean;
  minimizeToTray: boolean;
  autoStart: boolean;
  theme: 'light' | 'dark' | 'system';
}

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings>({
    refreshInterval: '12h',
    notifications: true,
    minimizeToTray: true,
    autoStart: false,
    theme: 'light'
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [appInfo, setAppInfo] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadAppInfo();
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const savedSettings = await window.electronAPI.getSettings();
        if (savedSettings) {
          setSettings({ ...settings, ...savedSettings });
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadAppInfo = async () => {
    try {
      if (window.electronAPI) {
        const info = await window.electronAPI.getAppInfo();
        setAppInfo(info);
      }
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    setSaveStatus('saving');
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(newSettings);
        setSettings(newSettings);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleIntervalChange = (interval: string) => {
    const newSettings = { ...settings, refreshInterval: interval };
    saveSettings(newSettings);
  };

  const handleToggle = (key: keyof AppSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case '1h': return '1 Hour';
      case '12h': return '12 Hours';
      case '1d': return '1 Day';
      case '1w': return '1 Week';
      default: return interval;
    }
  };

  const handleManualRefresh = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.refreshNews();
        alert('News refresh started!');
      }
    } catch (error) {
      console.error('Failed to refresh news:', error);
      alert('Failed to refresh news. Please try again.');
    }
  };

  const handleShowLogs = () => {
    if (window.electronAPI) {
      window.electronAPI.showLogs();
    }
  };

  return (
    <div className="settings-screen screen">
      <div className="settings-container">
        <div className="settings-header">
          <button onClick={onBack} className="back-btn">← Back to Home</button>
          <h1>Settings</h1>
          {saveStatus !== 'idle' && (
            <div className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' && '⏳ Saving...'}
              {saveStatus === 'saved' && '✅ Saved!'}
              {saveStatus === 'error' && '❌ Save failed'}
            </div>
          )}
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <h3>🔄 News Refresh Settings</h3>
            <div className="setting-description">
              How often should the app automatically check for new stories?
            </div>
            <div className="refresh-options">
              {['1h', '12h', '1d', '1w'].map(interval => (
                <label key={interval} className="refresh-option">
                  <input
                    type="radio"
                    name="refresh"
                    value={interval}
                    checked={settings.refreshInterval === interval}
                    onChange={() => handleIntervalChange(interval)}
                  />
                  <span className="option-label">{getIntervalLabel(interval)}</span>
                </label>
              ))}
            </div>
            <button onClick={handleManualRefresh} className="manual-refresh-btn">
              🔄 Refresh News Now
            </button>
          </div>

          <div className="setting-group">
            <h3>🔔 Notifications</h3>
            <label className="checkbox-option">
              <input 
                type="checkbox" 
                checked={settings.notifications}
                onChange={(e) => handleToggle('notifications', e.target.checked)}
              />
              <span className="option-label">Show desktop notifications when new stories arrive</span>
            </label>
          </div>

          <div className="setting-group">
            <h3>🖥️ Desktop Behavior</h3>
            <label className="checkbox-option">
              <input 
                type="checkbox" 
                checked={settings.minimizeToTray}
                onChange={(e) => handleToggle('minimizeToTray', e.target.checked)}
              />
              <span className="option-label">Minimize to system tray instead of closing</span>
            </label>
            <label className="checkbox-option">
              <input 
                type="checkbox" 
                checked={settings.autoStart}
                onChange={(e) => handleToggle('autoStart', e.target.checked)}
              />
              <span className="option-label">Start automatically when computer starts</span>
            </label>
          </div>

          <div className="setting-group">
            <h3>🎨 Appearance</h3>
            <div className="theme-options">
              {[
                { value: 'light', label: '☀️ Light' },
                { value: 'dark', label: '🌙 Dark' },
                { value: 'system', label: '🖥️ System' }
              ].map(theme => (
                <label key={theme.value} className="theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value={theme.value}
                    checked={settings.theme === theme.value}
                    onChange={() => handleToggle('theme', theme.value)}
                  />
                  <span className="option-label">{theme.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <h3>📊 Application Info</h3>
            <div className="app-info-grid">
              {appInfo && (
                <>
                  <div className="info-item">
                    <span className="info-label">Version:</span>
                    <span className="info-value">v{appInfo.version}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Platform:</span>
                    <span className="info-value">{appInfo.platform || 'Desktop'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Electron:</span>
                    <span className="info-value">v{appInfo.electronVersion || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="app-actions">
              <button onClick={handleShowLogs} className="utility-btn">
                📋 View Logs
              </button>
              <button 
                onClick={() => window.electronAPI?.showAbout()} 
                className="utility-btn"
              >
                ℹ️ About
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;