const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods for popup window
contextBridge.exposeInMainWorld('electronAPI', {
    getNewStories: () => {
        ipcRenderer.invoke('get-new-stories').then(stories => {
            window.electronAPI.onNewStories(stories);
        });
    },
    onNewStories: (callback) => {
        window.electronAPI.onNewStories = callback;
    },
    openMainWindow: () => ipcRenderer.invoke('open-main-window')
});