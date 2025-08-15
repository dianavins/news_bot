const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getStories: () => ipcRenderer.invoke('get-stories'),
    getStory: (storyId) => ipcRenderer.invoke('get-story', storyId),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    manualRefresh: () => ipcRenderer.invoke('manual-refresh')
});