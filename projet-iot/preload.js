const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose les APIs sécurisées au renderer process
 */
contextBridge.exposeInMainWorld('electron', {
    /**
     * Gestion Audio
     */
    audio: {
        getOutputs: () => ipcRenderer.invoke('get-audio-outputs'),
        getDefaultOutput: () => ipcRenderer.invoke('get-default-audio-output'),
        setOutput: (sinkId) => ipcRenderer.invoke('set-audio-output', sinkId),
        setVolume: (volume) => ipcRenderer.invoke('set-volume', volume),
        getVolume: () => ipcRenderer.invoke('get-volume'),
        togglePlayback: () => ipcRenderer.invoke('toggle-playback'),
        nextTrack: () => ipcRenderer.invoke('next-track'),
        previousTrack: () => ipcRenderer.invoke('previous-track'),
        getCurrentTrack: () => ipcRenderer.invoke('get-current-track'),
        getPlaybackStatus: () => ipcRenderer.invoke('get-playback-status')
    },
    navidrome: {
        isConfigured: () => ipcRenderer.invoke('navidrome-is-configured'),
        getServerUrl: () => ipcRenderer.invoke('navidrome-get-server-url'),
        getRecentSongs: () => ipcRenderer.invoke('navidrome-get-recent-songs'),
        getStreamUrl: (trackId) => ipcRenderer.invoke('navidrome-get-stream-url', trackId),
        getCredentials: () => ipcRenderer.invoke('navidrome-get-credentials')
    },

    /**
     * Gestion Bluetooth
     */
    // Backend auth credentials (from .env read by main)
    auth: {
        getCredentials: () => ipcRenderer.invoke('get-backend-credentials')
    },

    bluetooth: {
        enableDiscovery: () => ipcRenderer.invoke('bluetooth-enable-discovery'),
        disableDiscovery: () => ipcRenderer.invoke('bluetooth-disable-discovery'),
        getConnectedDevices: () => ipcRenderer.invoke('bluetooth-get-connected-devices'),
        connectDevice: (address) => ipcRenderer.invoke('bluetooth-connect-device', address),
        disconnectDevice: (address) => ipcRenderer.invoke('bluetooth-disconnect-device', address),
        routeAudio: (deviceAddress) => ipcRenderer.invoke('bluetooth-route-audio', deviceAddress)
    },
    gps: {
        start: () => ipcRenderer.invoke('gps-start'),
        stop: () => ipcRenderer.invoke('gps-stop'),
        getStatus: () => ipcRenderer.invoke('gps-status'),
        onPosition: (func) => ipcRenderer.on('gps-position', (event, position) => func(position)),
        onStatus: (func) => ipcRenderer.on('gps-status', (event, status) => func(status))
    },

    /**
     * Gestion des paramètres (.env)
     */
    settings: {
        loadSettings: () => ipcRenderer.invoke('settings-load'),
        saveSettings: (settings) => ipcRenderer.invoke('settings-save', settings)
    },

    /**
     * Envoyer un message au processus principal
     */
    send: (channel, data) => {
        const validChannels = ['gps-request', 'bluetooth-request', 'settings-request'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    /**
     * Recevoir des messages du processus principal
     */
    receive: (channel, func) => {
        const validChannels = ['gps-response', 'bluetooth-response', 'settings-response'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
