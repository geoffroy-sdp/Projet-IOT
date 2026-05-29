const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const readline = require('readline');

let mainWindow;
let controlBar;
let gpsReader = null;
let gpsFifoPath = process.argv[2] || '/tmp/carplay_gps.fifo';
let gpsState = {
    connected: false,
    lastError: null,
    lastPosition: null
};

const navidromeConfig = loadNavidromeConfig();

function loadNavidromeConfig() {
    try {
        const configPath = path.join(__dirname, 'navidrome-config.json');
        let config = null;
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(raw);
        } catch {
            config = null;
        }

        // Allow overriding server URL via environment variable or .env file
        const envUrl = process.env.NAVIDROME_URL || loadEnvFileValue('NAVIDROME_URL');
        if (envUrl) {
            if (!config) config = {};
            config.serverUrl = envUrl;
        }

        return config;
    } catch (e) {
        console.error('Erreur chargement config Navidrome:', e);
        return null;
    }
}

function loadEnvFileValue(key) {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) return null;
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const idx = trimmed.indexOf('=');
            if (idx === -1) continue;
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim();
            if (k === key) return v.replace(/^"|"$/g, '');
        }
        return null;
    } catch (e) {
        return null;
    }
}

function findGPSDevicePath() {
    // Deprecated: GPS est lancé via scripts/start.sh
    console.log('GPS: utilisation du FIFO', gpsFifoPath);
    return gpsFifoPath;
}

function parseNMEACoordinate(value, hemisphere) {
    if (!value || !hemisphere) return null;
    const floatVal = parseFloat(value);
    if (Number.isNaN(floatVal)) return null;
    const degrees = Math.floor(floatVal / 100);
    const minutes = floatVal - degrees * 100;
    let decimal = degrees + minutes / 60;
    if (hemisphere === 'S' || hemisphere === 'W') {
        decimal = -decimal;
    }
    return decimal;
}

function parseNMEALine(line) {
    if (!line.startsWith('$')) {
        console.log('GPS: ligne ne commence pas par $');
        return null;
    }
    const parts = line.split(',');
    console.log('GPS: type NMEA:', parts[0], 'parts count:', parts.length);
    
    if (parts[0].includes('GGA')) {
        console.log('GPS: parsing GGA');
        const lat = parseNMEACoordinate(parts[2], parts[3]);
        const lon = parseNMEACoordinate(parts[4], parts[5]);
        const fix = parts[6];
        const altitude = parseFloat(parts[9]) || null;
        console.log('GPS: GGA lat=', lat, 'lon=', lon, 'fix=', fix, 'alt=', altitude);
        if (lat !== null && lon !== null && fix && fix !== '0') {
            return { latitude: lat, longitude: lon, altitude, accuracy: null, source: 'GGA' };
        } else {
            console.log('GPS: GGA incomplet ou pas de fix');
        }
    }
    if (parts[0].includes('RMC')) {
        console.log('GPS: parsing RMC');
        const status = parts[2];
        const lat = parseNMEACoordinate(parts[3], parts[4]);
        const lon = parseNMEACoordinate(parts[5], parts[6]);
        const speedKnots = parseFloat(parts[7]) || 0;
        const course = parseFloat(parts[8]) || null;
        console.log('GPS: RMC status=', status, 'lat=', lat, 'lon=', lon, 'speed=', speedKnots);
        if (status === 'A' && lat !== null && lon !== null) {
            return {
                latitude: lat,
                longitude: lon,
                altitude: null,
                speed: speedKnots * 1.852,
                track: course,
                accuracy: null,
                source: 'RMC'
            };
        } else {
            console.log('GPS: RMC incomplet ou status invalide');
        }
    }
    console.log('GPS: type NMEA non reconnu ou incomplet');
    return null;
}

function sendGpsPosition(position) {
    gpsState.lastPosition = position;
    gpsState.lastError = null;
    console.log('GPS: position envoyée au renderer', position);
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('gps-position', position);
    }
}

function sendGpsStatus(status) {
    gpsState.lastError = status && status.startsWith('Erreur') ? status : gpsState.lastError;
    console.log('GPS: statut', status);
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('gps-status', status);
    }
}

function startGPS() {
    if (gpsReader) {
        gpsState.connected = true;
        sendGpsStatus('GPS connecté');
        return { success: true };
    }
    return { success: true };
}

function stopGPS() {
    gpsState.connected = false;
    sendGpsStatus('GPS arrêté');
    return { success: true };
}

function getGPSStatus() {
    return {
        connected: gpsState.connected,
        lastError: gpsState.lastError,
        position: gpsState.lastPosition,
        devicePath: gpsFifoPath
    };
}

function initGPSReader() {
    console.log('GPS: initialisation du lecteur FIFO', gpsFifoPath);
    if (!fs.existsSync(gpsFifoPath)) {
        console.warn('GPS: FIFO non trouvé, création en attente...');
        setTimeout(initGPSReader, 1000);
        return;
    }
    try {
        gpsReader = fs.createReadStream(gpsFifoPath, { encoding: 'utf8' });
        console.log('GPS: lecteur FIFO ouvert');
        gpsReader.on('error', (err) => {
            console.error('GPS reader FIFO error:', err);
            gpsReader = null;
            gpsState.connected = false;
            sendGpsStatus('Erreur GPS: ' + (err.message || err));
        });
        const rl = readline.createInterface({ input: gpsReader });
        rl.on('line', (line) => {
            const trimmedLine = line.trim();
            console.log('GPS: ligne reçue du FIFO:', trimmedLine);
            if (trimmedLine.startsWith('$')) {
                console.log('GPS: parsing NMEA...');
                const position = parseNMEALine(trimmedLine);
                console.log('GPS: position parsée:', position);
                if (position) {
                    gpsState.connected = true;
                    gpsState.lastError = null;
                    console.log('GPS: position envoyée au renderer');
                    sendGpsPosition(position);
                } else {
                    console.log('GPS: ligne NMEA ne contient pas de position valide');
                }
            }
        });
        gpsReader.on('close', () => {
            console.log('GPS reader FIFO fermé');
            gpsReader = null;
            gpsState.connected = false;
            sendGpsStatus('GPS arrêté');
        });
        gpsState.connected = true;
        sendGpsStatus('GPS connecté: ' + gpsFifoPath);
    } catch (err) {
        console.error('GPS init error:', err);
        gpsState.connected = false;
        gpsState.lastError = err.message || String(err);
        sendGpsStatus('Erreur GPS: ' + gpsState.lastError);
        setTimeout(initGPSReader, 1000);
    }
}

function getNavidromeAuthParams() {
    if (!navidromeConfig || !navidromeConfig.serverUrl || !navidromeConfig.username || !navidromeConfig.password) {
        return null;
    }

    const passwordHash = crypto
        .createHash('md5')
        .update(navidromeConfig.password)
        .digest('hex');

    const clientName = navidromeConfig.clientName || 'CarPlay';
    return `u=${encodeURIComponent(navidromeConfig.username)}&p=${passwordHash}&v=1.16.1&c=${encodeURIComponent(clientName)}`;
}

function navidromeApiUrl(endpoint, extra = '') {
    if (!navidromeConfig || !navidromeConfig.serverUrl) {
        return null;
    }

    const baseUrl = navidromeConfig.serverUrl.replace(/\/+$/, '');
    const authParams = getNavidromeAuthParams();
    if (!authParams) {
        return null;
    }

    return `${baseUrl}/rest/${endpoint}.view?${authParams}${extra ? '&' + extra : ''}`;
}

async function fetchNavidromeXml(endpoint, extra = '') {
    const url = navidromeApiUrl(endpoint, extra);
    if (!url) {
        return null;
    }

    const response = await fetch(url);
    return await response.text();
}

function parseNavidromeError(xml) {
    const match = xml.match(/<error[^>]*message="([^"]*)"/);
    return match ? match[1] : null;
}

function getXmlAttribute(attrs, name) {
    const match = attrs.match(new RegExp(`${name}="([^"]*)"`));
    return match ? match[1] : '';
}

function parseRecentSongs(xml) {
    const error = parseNavidromeError(xml);
    if (error) {
        return { error };
    }

    const tracks = [];
    const trackRegex = /<track\b([^>]+?)\s*\/?>/g;
    let match;

    while ((match = trackRegex.exec(xml)) !== null) {
        const attrs = match[1];
        const track = {
            id: getXmlAttribute(attrs, 'id'),
            title: getXmlAttribute(attrs, 'title'),
            artist: getXmlAttribute(attrs, 'artist'),
            album: getXmlAttribute(attrs, 'album'),
            duration: getXmlAttribute(attrs, 'duration')
        };

        if (track.id) {
            tracks.push(track);
        }
    }

    return { tracks };
}

// ========== IPC HANDLERS POUR NAVIDROME ==========

ipcMain.handle('navidrome-is-configured', async () => {
    return !!(navidromeConfig && navidromeConfig.serverUrl);
});

ipcMain.handle('navidrome-get-server-url', async () => {
    return navidromeConfig ? navidromeConfig.serverUrl : null;
});

ipcMain.handle('navidrome-get-recent-songs', async () => {
    try {
        const xml = await fetchNavidromeXml('getRecentSongs');
        return parseRecentSongs(xml);
    } catch (e) {
        return { error: e.message };
    }
});

ipcMain.handle('navidrome-get-stream-url', async (event, trackId) => {
    if (!navidromeConfig) return null;
    const baseUrl = navidromeConfig.serverUrl.replace(/\/+$/, '');
    const authParams = getNavidromeAuthParams();
    if (!authParams) return null;
    return `${baseUrl}/rest/stream.view?id=${encodeURIComponent(trackId)}&${authParams}`;
});

ipcMain.handle('navidrome-get-credentials', async () => {
    const envUser = process.env.NAVIDROME_USER || loadEnvFileValue('NAVIDROME_USER');
    const envPass = process.env.NAVIDROME_PASS || loadEnvFileValue('NAVIDROME_PASS');
    const user = envUser || (navidromeConfig && navidromeConfig.username) || null;
    const pass = envPass || (navidromeConfig && navidromeConfig.password) || null;
    return { username: user, password: pass };
});

/**
 * Crée la fenêtre principale (écran CarPlay)
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 450,
        x: 0,
        y: 0,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true
        },
        frame: false,
        alwaysOnTop: false
    });

    mainWindow.loadFile('index.html');
    
    // Ouvrir les devtools en développement (à commenter en production)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (controlBar) {
            controlBar.close();
        }
        app.quit();
    });
}

/**
 * Crée la barre de contrôle audio (fenêtre indépendante)
 */
function createControlBar() {
    controlBar = new BrowserWindow({
        width: 1024,
        height: 150,
        x: 0,
        y: 450, // Positionnée directement sous l'écran principal
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        frame: false,
        alwaysOnTop: false
    });

    // Charger la page de barre de contrôle
    controlBar.loadFile('control-bar.html');
    
    controlBar.on('closed', () => {
        controlBar = null;
    });
}

/**
 * Initialisation de l'application
 */
app.on('ready', () => {
    createMainWindow();
    createControlBar();
    initGPSReader();
});

/**
 * Quitter l'application
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
        createControlBar();
    }
});

/**
 * Gestion des erreurs non capturées
 */
process.on('uncaughtException', (error) => {
    console.error('Erreur non capturée:', error);
});

// ========== IPC HANDLERS POUR AUDIO ==========

/**
 * Récupère les sorties audio disponibles
 */
ipcMain.handle('get-audio-outputs', async () => {
    return new Promise((resolve) => {
        exec('pactl list short sinks', (error, stdout, stderr) => {
            if (error) {
                console.error('Erreur pactl:', error);
                resolve([]);
                return;
            }

            const sinks = [];
            const lines = stdout.trim().split('\n');
            
            lines.forEach((line) => {
                if (!line) return;
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    sinks.push({
                        id: parts[0],
                        name: parts[1],
                        description: parts[2] || parts[1]
                    });
                }
            });

            resolve(sinks);
        });
    });
});

/**
 * Obtient la sortie audio actuelle
 */
ipcMain.handle('get-default-audio-output', async () => {
    return new Promise((resolve) => {
        exec('pactl get-default-sink', (error, stdout, stderr) => {
            if (error) {
                console.error('Erreur pactl:', error);
                resolve(null);
                return;
            }
            resolve(stdout.trim());
        });
    });
});

/**
 * Change la sortie audio
 */
ipcMain.handle('set-audio-output', async (event, sinkId) => {
    return new Promise((resolve) => {
        exec(`pactl set-default-sink ${sinkId}`, (error) => {
            if (error) {
                console.error('Erreur changement sortie:', error);
                resolve(false);
                return;
            }
            console.log(`Sortie audio changée vers: ${sinkId}`);
            resolve(true);
        });
    });
});

/**
 * Change le volume
 */
ipcMain.handle('set-volume', async (event, volume) => {
    return new Promise((resolve) => {
        const volumePercent = Math.max(0, Math.min(100, volume));
        exec(`pactl set-sink-volume @DEFAULT_SINK@ ${volumePercent}%`, (error) => {
            if (error) {
                console.error('Erreur volume:', error);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
});

/**
 * Obtient le volume actuel
 */
ipcMain.handle('get-volume', async () => {
    return new Promise((resolve) => {
        exec("pactl get-sink-volume @DEFAULT_SINK@ | grep -oP '\\d+(?=%)'", (error, stdout, stderr) => {
            if (error) {
                console.error('Erreur lecture volume:', error);
                resolve(50);
                return;
            }
            const volumes = stdout.trim().split('\n');
            resolve(parseInt(volumes[0]) || 50);
        });
    });
});

/**
 * Contrôle de la lecture (play/pause) - utilise playerctl
 */
ipcMain.handle('toggle-playback', async () => {
    return new Promise((resolve) => {
        exec('playerctl play-pause', (error) => {
            if (error) {
                console.error('Erreur playback:', error);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
});

/**
 * Piste suivante
 */
ipcMain.handle('next-track', async () => {
    return new Promise((resolve) => {
        exec('playerctl next', (error) => {
            if (error) {
                console.error('Erreur next:', error);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
});

/**
 * Piste précédente
 */
ipcMain.handle('previous-track', async () => {
    return new Promise((resolve) => {
        exec('playerctl previous', (error) => {
            if (error) {
                console.error('Erreur previous:', error);
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
});

ipcMain.handle('get-current-track', async () => {
    return new Promise((resolve) => {
        exec(`playerctl metadata --format '{{xesam:title}}|||{{xesam:artist}}|||{{xesam:album}}'`, (error, stdout) => {
            if (error) {
                resolve({ title: 'Aucune piste', artist: 'Inconnu', album: 'Inconnu' });
                return;
            }

            const [title, artist, album] = stdout.trim().split('|||');
            resolve({
                title: title || 'Aucune piste',
                artist: artist || 'Inconnu',
                album: album || 'Inconnu'
            });
        });
    });
});

ipcMain.handle('get-playback-status', async () => {
    return new Promise((resolve) => {
        exec('playerctl status', (error, stdout) => {
            if (error) {
                resolve('Stopped');
                return;
            }
            resolve(stdout.trim());
        });
    });
});
ipcMain.handle('gps-start', async () => {
    return startGPS();
});

ipcMain.handle('gps-stop', async () => {
    return stopGPS();
});

ipcMain.handle('gps-status', async () => {
    return getGPSStatus();
});
// ========== IPC HANDLERS POUR BLUETOOTH ==========

/**
 * Active la mode de découverte Bluetooth
 */
ipcMain.handle('bluetooth-enable-discovery', async () => {
    return new Promise((resolve) => {
        console.log('Activation du mode de découverte Bluetooth...');
        
        // Rendre l'appareil découvrable
        exec(`bluetoothctl discoverable on`, (error, stdout, stderr) => {
            if (error) {
                console.error('Erreur activation découverte:', error);
                resolve(false);
                return;
            }
            
            // Activer aussi le scanning
            exec(`bluetoothctl scan on`, (scanError) => {
                if (!scanError) {
                    console.log('✓ Mode découverte activé');
                    resolve(true);
                } else {
                    console.log('✓ Mode découverte activé (sans scanning)');
                    resolve(true);
                }
            });
        });
    });
});

/**
 * Désactive la mode de découverte Bluetooth
 */
ipcMain.handle('bluetooth-disable-discovery', async () => {
    return new Promise((resolve) => {
        console.log('Désactivation du mode de découverte...');
        
        exec(`bluetoothctl discoverable off`, (error) => {
            if (error) {
                console.error('Erreur désactivation:', error);
                resolve(false);
                return;
            }
            
            exec(`bluetoothctl scan off`, (scanError) => {
                console.log('✓ Mode découverte désactivé');
                resolve(true);
            });
        });
    });
});

/**
 * Récupère les appareils Bluetooth connectés
 */
ipcMain.handle('bluetooth-get-connected-devices', async () => {
    return new Promise((resolve) => {
        exec(`bluetoothctl devices Connected`, (error, stdout, stderr) => {
            if (error) {
                console.error('Erreur récupération appareils:', error);
                resolve([]);
                return;
            }

            const devices = [];
            const lines = stdout.trim().split('\n');

            lines.forEach((line) => {
                if (!line) return;
                const parts = line.match(/Device\s+([0-9A-F:]+)\s+(.*)/i);
                if (parts && parts.length === 3) {
                    devices.push({
                        address: parts[1],
                        name: parts[2],
                        connected: true
                    });
                }
            });

            resolve(devices);
        });
    });
});

/**
 * Connecte un appareil Bluetooth
 */
ipcMain.handle('bluetooth-connect-device', async (event, address) => {
    return new Promise((resolve) => {
        console.log(`Connexion à ${address}`);
        
        exec(`bluetoothctl connect ${address}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur connexion ${address}:`, error);
                resolve(false);
                return;
            }
            
            console.log(`Connecté à ${address}`);
            resolve(true);
        });
    });
});

/**
 * Déconnecte un appareil Bluetooth
 */
ipcMain.handle('bluetooth-disconnect-device', async (event, address) => {
    return new Promise((resolve) => {
        console.log(`Déconnexion de ${address}`);
        
        exec(`bluetoothctl disconnect ${address}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur déconnexion ${address}:`, error);
                resolve(false);
                return;
            }
            
            console.log(`Déconnecté de ${address}`);
            resolve(true);
        });
    });
});

/**
 * Route l'audio Bluetooth vers la sortie Jack
 */
ipcMain.handle('bluetooth-route-audio', async (event, deviceAddress) => {
    return new Promise((resolve) => {
        console.log(`Routage audio pour ${deviceAddress}`);
        
        // Attendre un peu que le flux arrive
        setTimeout(() => {
            exec("pactl list short sink-inputs", (error, stdout) => {
                if (error) {
                    console.error('Erreur pactl:', error);
                    resolve(false);
                    return;
                }

                const lines = stdout.split('\n');
                const jackSinkId = exec("pactl list short sinks | grep -E 'hw:1,0|alsa_output' | head -1 | awk '{print $1}'", (err, sinkId) => {
                    if (err) {
                        console.error('Erreur trouvage sink:', err);
                        resolve(false);
                        return;
                    }

                    sinkId = sinkId.trim();

                    lines.forEach(line => {
                        if (!line) return;

                        const parts = line.split('\t');
                        const inputId = parts[0];
                        const inputName = parts[4] || '';

                        if (inputName.toLowerCase().includes('bluetooth') ||
                            inputName.toLowerCase().includes('bluez') ||
                            inputName.toLowerCase().includes('a2dp')) {

                            console.log(`Redirection flux Bluetooth ${inputId} vers Jack`);
                            exec(`pactl move-sink-input ${inputId} ${sinkId}`, (err) => {
                                if (!err) console.log(`✓ Flux ${inputId} redirigé`);
                            });
                        }
                    });

                    resolve(true);
                });
            });
        }, 1000);
    });
});
