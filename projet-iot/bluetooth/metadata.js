const dbus = require("dbus-next");
const bus = dbus.systemBus();
const { exec } = require("child_process");

let manager = null;
let attachedPlayers = new Set(); // Tracker des players avec listeners

async function initManager() {
    if (!manager) {
        const obj = await bus.getProxyObject("org.bluez", "/");
        manager = obj.getInterface("org.freedesktop.DBus.ObjectManager");
    }
    return manager;
}

// Router le flux audio Bluetooth vers Jack (hw:1,0)
function routeBluetoothAudio() {
    console.log("Configuration du routage audio Bluetooth...");
    
    // Attendre un peu que les flux arrivent
    setTimeout(() => {
        exec("pactl list short sink-inputs", (error, stdout) => {
            if (error) return;
            
            const lines = stdout.split('\n');
            const jackSinkId = exec("pactl list short sinks | grep -E 'hw:1,0|alsa_output' | head -1 | awk '{print $1}'", (err, sinkId) => {
                if (err) return;
                
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
            });
        });
    }, 1000);
}

// Activer le profil A2DP pour la sortie audio
async function enableA2DP(devicePath) {
    try {
        console.log(`Activation A2DP pour ${devicePath}`);
        
        const deviceObj = await bus.getProxyObject("org.bluez", devicePath);
        const props = deviceObj.getInterface("org.freedesktop.DBus.Properties");
        
        // Un délai pour qu'il y ait le temps de connecter
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Essayer de se connecter à AudioSink
        try {
            const audioSink = deviceObj.getInterface("org.bluez.AudioSink");
            if (audioSink) {
                await audioSink.Connect();
                console.log("✓ AudioSink connecté (A2DP)");
                
                // Router l'audio vers Jack après la connexion
                routeBluetoothAudio();
            }
        } catch (e) {
            console.log("AudioSink non disponible:", e.message);
            // Même si AudioSink n'est pas disponible, essayer de router
            routeBluetoothAudio();
        }
    } catch (e) {
        console.error("Erreur A2DP:", e.message);
    }
}

// Scan manuel
async function scanBluetooth() {
    const manager = await initManager();
    const objects = await manager.GetManagedObjects();

    console.log("SCAN COMPLET DES OBJETS BLUEZ :");
    console.log(objects);

    let hasConnectedDevice = false;

    for (const path in objects) {
        const dev = objects[path]["org.bluez.Device1"];
        if (dev && dev.Connected?.value === true) {
            console.log("DEVICE CONNECTÉ TROUVÉ :", path);
            hasConnectedDevice = true;
            global.connectionCallback?.("connected");
            
            // Activer A2DP pour l'audio
            await enableA2DP(path);
        }

        // Chercher les MediaPlayer sous le device connecté
        if (objects[path]["org.bluez.MediaPlayer1"]) {
            console.log("MEDIAPLAYER TROUVÉ :", path);
            attachMetadataListener(path);
        }
    }

    // Si aucun device connecté, notifier la déconnexion
    if (!hasConnectedDevice) {
        global.connectionCallback?.("disconnected");
    }
}

async function listenConnection(callback) {
    global.connectionCallback = callback;

    const manager = await initManager();

    // Scan initial - cela trouvera aussi les devices connectés AVANT Electron
    await scanBluetooth();

    manager.on("InterfacesAdded", (path, interfaces) => {
        console.log("InterfacesAdded:", path, interfaces);

        if (interfaces["org.bluez.Device1"]) {
            const dev = interfaces["org.bluez.Device1"];
            if (dev.Connected?.value === true) {
                callback("connected");
                // Activer A2DP pour l'audio
                enableA2DP(path).catch(e => console.error("Erreur A2DP:", e));
            }
        }

        if (interfaces["org.bluez.MediaPlayer1"]) {
            attachMetadataListener(path);
        }
    });

    manager.on("InterfacesRemoved", (path, interfaces) => {
        console.log("InterfacesRemoved:", path, interfaces);

        if (interfaces.includes("org.bluez.Device1")) {
            callback("disconnected");
        }
    });

    // Polling périodique pour détecter les changements de connexion
    setInterval(async () => {
        try {
            const objects = await manager.GetManagedObjects();
            let isConnected = false;
            let connectedDevicePath = null;

            for (const path in objects) {
                const dev = objects[path]["org.bluez.Device1"];
                if (dev && dev.Connected?.value === true) {
                    isConnected = true;
                    connectedDevicePath = path;
                    // Attacher listener si le player existe
                    if (objects[path]["org.bluez.MediaPlayer1"]) {
                        attachMetadataListener(path);
                    }
                    break;
                }
            }

            // Détecter les changements de connexion
            if (isConnected !== global.lastConnectedState) {
                global.lastConnectedState = isConnected;
                if (isConnected) {
                    callback("connected");
                    // Activer A2DP pour l'audio
                    if (connectedDevicePath) {
                        await enableA2DP(connectedDevicePath);
                    }
                } else {
                    callback("disconnected");
                }
            }
        } catch (e) {
            console.error("Erreur polling connexion:", e.message);
        }
    }, 2000);
}

async function listenMetadata(callback) {
    global.metadataCallback = callback;
}

async function listenPlayerProgress(callback) {
    global.playerProgressCallback = callback;

    // Polling périodique de la position
    setInterval(async () => {
        try {
            const path = await getMediaPlayerPath();
            if (!path) return;

            const playerObj = await bus.getProxyObject("org.bluez", path);
            const props = playerObj.getInterface("org.freedesktop.DBus.Properties");

            // Récupérer la position et le statut
            const positionReq = props.Get("org.bluez.MediaPlayer1", "Position");
            const statusReq = props.Get("org.bluez.MediaPlayer1", "Status");

            const [positionResult, statusResult] = await Promise.all([positionReq, statusReq]);

            if (positionResult || statusResult) {
                callback({
                    position: positionResult?.value || 0,
                    duration: null,
                    status: statusResult?.value || null
                });
            }
        } catch (e) {
            // Erreurs silencieuses pour le polling
            console.log("Polling position - pas de données");
        }
    }, 200); // Poll toutes les 200ms
}

// Obtenir le chemin du MediaPlayer actuel
async function getMediaPlayerPath() {
    try {
        const manager = await initManager();
        const objects = await manager.GetManagedObjects();

        for (const path in objects) {
            if (objects[path]["org.bluez.MediaPlayer1"]) {
                return path;
            }
        }
    } catch (e) {
        console.error("Erreur getMediaPlayerPath:", e.message);
    }
    return null;
}

// Garder l'état de lecture en cache
let cachedPlayerStatus = null;

// Récupérer le statut de lecture
async function getPlayerStatus() {
    try {
        const path = await getMediaPlayerPath();
        if (!path) return null;

        const playerObj = await bus.getProxyObject("org.bluez", path);
        const props = playerObj.getInterface("org.freedesktop.DBus.Properties");
        const status = await props.Get("org.bluez.MediaPlayer1", "Status");
        return status?.value || null;
    } catch (e) {
        console.error("Erreur getPlayerStatus:", e.message);
        return null;
    }
}

// Contrôles AVRCP - Toggle Play/Pause
async function togglePlayPause() {
    try {
        const path = await getMediaPlayerPath();
        if (!path) {
            console.log("Aucun MediaPlayer trouvé");
            return;
        }

        const playerObj = await bus.getProxyObject("org.bluez", path);
        const player = playerObj.getInterface("org.bluez.MediaPlayer1");
        const props = playerObj.getInterface("org.freedesktop.DBus.Properties");
        
        // Récupérer le statut actuel
        const status = await props.Get("org.bluez.MediaPlayer1", "Status");
        const currentStatus = status?.value;
        
        if (currentStatus === "playing") {
            await player.Pause();
            console.log("Pause commandée");
        } else {
            await player.Play();
            console.log("Play commandé");
        }
    } catch (e) {
        console.error("Erreur togglePlayPause:", e.message);
    }
}

async function nextTrack() {
    try {
        const path = await getMediaPlayerPath();
        if (!path) {
            console.log("Aucun MediaPlayer trouvé");
            return;
        }

        const playerObj = await bus.getProxyObject("org.bluez", path);
        const player = playerObj.getInterface("org.bluez.MediaPlayer1");
        await player.Next();
        console.log("Next commandé");
    } catch (e) {
        console.error("Erreur next:", e.message);
    }
}

async function previousTrack() {
    try {
        const path = await getMediaPlayerPath();
        if (!path) {
            console.log("Aucun MediaPlayer trouvé");
            return;
        }

        const playerObj = await bus.getProxyObject("org.bluez", path);
        const player = playerObj.getInterface("org.bluez.MediaPlayer1");
        await player.Previous();
        console.log("Previous commandé");
    } catch (e) {
        console.error("Erreur previous:", e.message);
    }
}

// Obtenir l'adaptateur par défaut
async function getAdapter() {
    try {
        const manager = await initManager();
        const objects = await manager.GetManagedObjects();

        for (const path in objects) {
            if (objects[path]["org.bluez.Adapter1"]) {
                return path;
            }
        }
    } catch (e) {
        console.error("Erreur getAdapter:", e.message);
    }
    return null;
}

// Configurer la Pi comme serveur Bluetooth (discoverable)
async function enableBluetoothServer() {
    try {
        const adapterPath = await getAdapter();
        if (!adapterPath) {
            console.log("Aucun adaptateur trouvé");
            return false;
        }

        const adapterObj = await bus.getProxyObject("org.bluez", adapterPath);
        const adapter = adapterObj.getInterface("org.bluez.Adapter1");
        const props = adapterObj.getInterface("org.freedesktop.DBus.Properties");

        // Activer Bluetooth
        await props.Set("org.bluez.Adapter1", "Powered", true);
        
        // Rendre découvrable
        await props.Set("org.bluez.Adapter1", "Discoverable", true);
        
        // Durée de découverte illimitée
        await props.Set("org.bluez.Adapter1", "DiscoverableTimeout", 0);

        console.log("Bluetooth serveur activé et découvrable");
        return true;
    } catch (e) {
        console.error("Erreur enableBluetoothServer:", e.message);
        return false;
    }
}

// Lister les appareils connectés
async function getConnectedDevices() {
    try {
        const manager = await initManager();
        const objects = await manager.GetManagedObjects();
        
        const devices = [];
        
        for (const path in objects) {
            const dev = objects[path]["org.bluez.Device1"];
            if (dev && dev.Connected?.value === true) {
                devices.push({
                    path: path,
                    address: dev.Address?.value || "unknown",
                    name: dev.Name?.value || dev.Alias?.value || "Unknown Device",
                    connected: true
                });
            }
        }
        
        return devices;
    } catch (e) {
        console.error("Erreur getConnectedDevices:", e.message);
        return [];
    }
}

async function attachMetadataListener(path) {
    // Éviter d'attacher plusieurs fois le même listener
    if (attachedPlayers.has(path)) {
        return;
    }

    console.log("ATTACH METADATA LISTENER SUR :", path);
    attachedPlayers.add(path);

    try {
        const playerObj = await bus.getProxyObject("org.bluez", path);
        const player = playerObj.getInterface("org.bluez.MediaPlayer1");
        const props = playerObj.getInterface("org.freedesktop.DBus.Properties");

        // Récupérer les métadonnées initiales
        try {
            const metadata = await props.Get("org.bluez.MediaPlayer1", "Track");
            if (metadata && metadata.value) {
                const track = metadata.value;
                global.metadataCallback?.({
                    title: track.Title?.value || "—",
                    artist: track.Artist?.value || "—",
                    album: track.Album?.value || "—"
                });
            }
        } catch (e) {
            console.log("Métadonnées initiales non disponibles (Track)");
        }

        // Récupérer la position et durée initiales
        try {
            const position = await props.Get("org.bluez.MediaPlayer1", "Position");
            const duration = await props.Get("org.bluez.MediaPlayer1", "Track");
            if (duration && duration.value && duration.value.Duration) {
                global.playerProgressCallback?.({
                    position: position?.value || 0,
                    duration: duration.value.Duration?.value || 0,
                    status: "unknown"
                });
            }
        } catch (e) {
            console.log("Position/Durée initiales non disponibles");
        }

        // Écouter les changements de propriété
        props.on("PropertiesChanged", (iface, changed) => {
            console.log("PropertiesChanged:", iface, changed);

            // Métadonnées - Nouvelle interface AVRCP (3.0+)
            if (changed.Metadata && changed.Metadata.value) {
                const meta = changed.Metadata.value;
                global.metadataCallback?.({
                    title: meta["xesam:title"]?.value || "—",
                    artist: meta["xesam:artist"]?.value || "—",
                    album: meta["xesam:album"]?.value || "—"
                });
            }

            // Métadonnées - Ancienne interface AVRCP (ton cas)
            if (changed.Track && changed.Track.value) {
                const track = changed.Track.value;
                global.metadataCallback?.({
                    title: track.Title?.value || "—",
                    artist: track.Artist?.value || "—",
                    album: track.Album?.value || "—"
                });
                
                // Envoyer aussi la durée si disponible
                if (track.Duration?.value) {
                    global.playerProgressCallback?.({
                        position: 0,
                        duration: track.Duration.value,
                        status: "playing"
                    });
                }
            }

            // Position de lecture
            if (changed.Position !== undefined) {
                global.playerProgressCallback?.({
                    position: changed.Position.value || 0,
                    duration: null,
                    status: null
                });
            }

            // Statut de lecture
            if (changed.Status) {
                global.playerProgressCallback?.({
                    position: null,
                    duration: null,
                    status: changed.Status.value
                });
            }
        });
    } catch (e) {
        console.error("Erreur attachMetadataListener:", e.message);
        attachedPlayers.delete(path); // Retirer du tracking en cas d'erreur
    }
}

// Écouter les appareils découverts/connectés
async function listenDiscoveredDevices(callback) {
    global.devicesCallback = callback;

    const manager = await initManager();

    manager.on("InterfacesAdded", (path, interfaces) => {
        if (interfaces["org.bluez.Device1"]) {
            const dev = interfaces["org.bluez.Device1"];
            callback({
                path: path,
                address: dev.Address?.value,
                name: dev.Name?.value || dev.Alias?.value || "Unknown",
                paired: dev.Paired?.value || false,
                connected: dev.Connected?.value || false,
                rssi: dev.RSSI?.value || 0,
                event: "added"
            });
        }
    });

    manager.on("InterfacesRemoved", (path) => {
        callback({
            path: path,
            event: "removed"
        });
    });
}

module.exports = { 
    scanBluetooth, 
    listenMetadata,
    listenPlayerProgress,
    listenConnection,
    listenDiscoveredDevices,
    togglePlayPause,
    nextTrack,
    previousTrack,
    enableBluetoothServer,
    getConnectedDevices
};
