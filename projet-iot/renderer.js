// ========== ÉTAT DE L'APPLICATION ==========
let isPlaying = false;
let currentVolume = 70;
let isMuted = false;
let audioOutputs = [];
let currentOutput = null;
let bluetoothConnected = false;
let bluetoothPlaying = false;
let navidromeActive = false;

// ========== ÉTAT BLUETOOTH ==========
let bluetoothDevices = [];
let selectedBluetoothDevice = null;
let isAudioRouted = false;
let discoveryActive = false;

// ========== ÉLEMENTS DU DOM BARRE DE CONTRÔLE ==========
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const audioOutput = document.getElementById('audioOutput');

// ========== ÉLÉMENTS DU DOM PAGE PRINCIPALE ==========
const gpsBtn = document.getElementById('gpsBtn');
const bluetoothBtn = document.getElementById('bluetoothBtn');
const musicBtn = document.getElementById('musicBtn');
const headerBackBtn = document.getElementById('headerBackBtn');
const settingsBtn = document.getElementById('settingsBtn');

const musicWebviewContainer = document.getElementById('musicWebviewContainer');
const navidromeWebview = document.getElementById('navidromeWebview');

// Elements musicaux (legacy, non utilisés avec la webview)
const trackTitle = null;
const trackArtist = null;
const trackAlbum = null;
const trackStatus = null;
const musicPlayPauseBtn = null;
const musicPrevBtn = null;
const musicNextBtn = null;

const gpsContainer = document.getElementById('gpsContainer');
const gpsStatusBar = document.getElementById('gpsStatusBar');
const gpsMapElement = document.getElementById('gpsMap');

let webviewPollingInterval = null;
let gpsMap = null;
let gpsMarker = null;
let gpsAccuracyCircle = null;
let storedPolyline = null;
let storedMarkers = [];

// ========== ÉLÉMENTS DU DOM BLUETOOTH ==========
const bluetoothInterface = document.getElementById('bluetoothInterface');
const devicesList = document.getElementById('devicesList');
const discoveryStatus = document.getElementById('discoveryStatus');

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Interface chargée');
    
    // Initialiser les éléments de la barre de contrôle
    if (playPauseBtn) {
        initAudioControls();
        await loadAudioOutputs();
        await initializeVolume();
    }
    
    // Initialiser les boutons de la page principale
    initMainButtons();

    if (window.electron?.gps?.onPosition) {
        window.electron.gps.onPosition(updateGPSPosition);
    }
    if (window.electron?.gps?.onStatus) {
        window.electron.gps.onStatus(updateGPSStatus);
    }
    updateGPSStatus('GPS actif');
    if (window.electron?.gps?.start) {
        window.electron.gps.start().then((result) => {
            if (!result?.success) {
                updateGPSStatus(result?.message || 'Impossible de démarrer le GPS');
            }
        }).catch((err) => {
            console.error('Erreur démarrage GPS initial:', err);
            updateGPSStatus('Erreur GPS: ' + (err.message || err));
        });
    }

    // Initialiser la découverte Bluetooth automatique en arrière-plan
    initAutoBluetoothDiscovery();

    // Écouter les changements de connexion Bluetooth
    listenBluetoothConnectionChanges();
});

// ========== GESTION DE LA BARRE DE CONTRÔLE ==========

/**
 * Initialise tous les contrôles audio
 */
function initAudioControls() {
    // Bouton Play/Pause
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayback);
    }

    // Bouton Précédent
    if (prevBtn) {
        prevBtn.addEventListener('click', previousTrack);
    }

    // Bouton Suivant
    if (nextBtn) {
        nextBtn.addEventListener('click', nextTrack);
    }

    // Bouton Mute
    if (muteBtn) {
        muteBtn.addEventListener('click', toggleMute);
    }

    // Slider Volume
    if (volumeSlider) {
        volumeSlider.addEventListener('input', handleVolumeChange);
    }

    // Sélection sortie audio
    if (audioOutput) {
        audioOutput.addEventListener('change', handleAudioOutputChange);
    }

    // Support clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);

    updatePlayPauseIcon();
    updateVolumeIcon();
}

/**
 * Charge les sorties audio disponibles
 */
async function loadAudioOutputs() {
    try {
        audioOutputs = await window.electron.audio.getOutputs();
        const defaultOutput = await window.electron.audio.getDefaultOutput();
        currentOutput = defaultOutput;

        if (audioOutput) {
            // Vider le select
            audioOutput.innerHTML = '';

            // Ajouter les sorties audio
            audioOutputs.forEach((output) => {
                const option = document.createElement('option');
                option.value = output.id;
                option.textContent = output.description.substring(0, 20);
                
                if (output.id === defaultOutput) {
                    option.selected = true;
                }
                
                audioOutput.appendChild(option);
            });

            console.log('Sorties audio chargées:', audioOutputs);
        }
    } catch (error) {
        console.error('Erreur chargement sorties audio:', error);
    }
}

/**
 * Initialise le volume
 */
async function initializeVolume() {
    try {
        const volume = await window.electron.audio.getVolume();
        currentVolume = volume;
        if (volumeSlider) {
            volumeSlider.value = volume;
        }
        if (volumeValue) {
            volumeValue.textContent = volume + '%';
        }
        updateVolumeIcon();
        console.log('Volume initial:', volume);
    } catch (error) {
        console.error('Erreur initialisation volume:', error);
    }
}

/**
 * Bascule Play/Pause
 */
async function togglePlayback() {
    // Try control inside the webview first (if Navidrome web UI is loaded)
    if (navidromeWebview && navidromeWebview.getURL && navidromeWebview.getURL() !== 'about:blank') {
        try {
            const res = await executeInWebview(`(function(){
                const m = document.querySelector('audio,video');
                if (m) { if (m.paused) { m.play(); return 'playing'; } else { m.pause(); return 'paused'; } }
                const btn = document.querySelector('[aria-label*="Play" i], [aria-label*="play" i], .play, .toggle-play');
                if (btn) { btn.click(); return 'toggled'; }
                return 'no-media';
            })()`);

            if (res) {
                isPlaying = (res === 'playing' || res === 'toggled');
                updatePlayPauseIcon();
                updateMusicPlayPauseIcon();
                updateAudioStatus();
                await refreshTrackInfo();
                return;
            }
        } catch (error) {
            console.error('Erreur controle webview:', error);
        }
    }

    // Fallback to system playerctl control
    try {
        const success = await window.electron.audio.togglePlayback();
        if (success) {
            const status = await window.electron.audio.getPlaybackStatus();
            isPlaying = status === 'Playing';
            updatePlayPauseIcon();
            updateMusicPlayPauseIcon();
            updateAudioStatus();
            refreshTrackInfo();
            console.log(isPlaying ? 'Lecture' : 'Pause');
        }
    } catch (error) {
        console.error('Erreur playback:', error);
    }
}

async function refreshTrackInfo() {
    // Try to get metadata from webview (Navidrome UI)
    if (navidromeWebview && navidromeWebview.getURL && navidromeWebview.getURL() !== 'about:blank') {
        try {
            const meta = await executeInWebview(`(function(){
                const title = (document.querySelector('.now-playing .title') || document.querySelector('.track-title') || document.querySelector('[data-testid="track-title"]'))?.textContent || document.title || '';
                const artist = (document.querySelector('.now-playing .artist') || document.querySelector('.track-artist') || document.querySelector('[data-testid="track-artist"]'))?.textContent || '';
                const status = (document.querySelector('audio,video') && !document.querySelector('audio,video').paused) ? 'Playing' : 'Paused';
                return { title, artist, album: '', status };
            })()`);

            if (meta) {
                updateTrackInfoUI({ title: meta.title || 'Aucune piste', artist: meta.artist || 'Inconnu', album: meta.album || 'Inconnu' }, meta.status || 'Paused');
                return;
            }
        } catch (e) {
            console.error('Erreur lecture meta webview:', e);
        }
    }

    // Fallback to system metadata via playerctl
    try {
        const metadata = await window.electron.audio.getCurrentTrack();
        const status = await window.electron.audio.getPlaybackStatus();
        updateTrackInfoUI(metadata, status);
    } catch (error) {
        console.error('Erreur récupération piste:', error);
    }
}

function updateTrackInfoUI(metadata, status) {
    if (trackTitle) {
        trackTitle.textContent = metadata.title || 'Aucune piste en cours';
    }
    if (trackArtist) {
        trackArtist.textContent = metadata.artist || 'Artiste inconnu';
    }
    if (trackAlbum) {
        trackAlbum.textContent = metadata.album || 'Album inconnu';
    }
    if (trackStatus) {
        trackStatus.textContent = `Statut : ${status || 'Arrêté'}`;
    }

    isPlaying = status === 'Playing';
    updatePlayPauseIcon();
    updateMusicPlayPauseIcon();
}

function setMusicStatus(message) {
    if (trackStatus) {
        trackStatus.textContent = message;
    }
}

async function initializeNavidromeMusic() {
    // Legacy: with webview we don't pre-load a playlist. Ensure Navidrome is configured.
    if (!(await window.electron.navidrome.isConfigured())) {
        setMusicStatus('Navidrome non configuré. Créez navidrome-config.json.');
        return;
    }
}

async function loadNavidromePlaylist() {
    // Not used with webview approach
}

async function playNavidromeTrack(index) {
    // Not used with webview approach
}

async function navigateNavidromeTrack(step) {
    if (step < 0) return previousTrack();
    return nextTrack();
}

function updateMusicPlayPauseIcon() {
    const buttons = [playPauseBtn, musicPlayPauseBtn];
    buttons.forEach((btn) => {
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;

        if (isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            btn.title = 'Pause';
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            btn.title = 'Lecture';
        }
    });
}

// Webview metadata polling helper
async function executeInWebview(code) {
    if (!navidromeWebview) return null;
    try {
        return await navidromeWebview.executeJavaScript(code, true);
    } catch (e) {
        console.error('executeInWebview error', e);
        return null;
    }
}

function startWebviewPolling() {
    if (webviewPollingInterval) return;
    webviewPollingInterval = setInterval(refreshTrackInfo, 3000);
}

function stopWebviewPolling() {
    if (webviewPollingInterval) {
        clearInterval(webviewPollingInterval);
        webviewPollingInterval = null;
    }
}

/**
 * Piste précédente
 */
async function previousTrack() {
    // Try to trigger previous inside webview first
    if (navidromeWebview && navidromeWebview.getURL && navidromeWebview.getURL() !== 'about:blank') {
        try {
            const res = await executeInWebview(`(function(){
                const sels = ['[aria-label*="Previous" i]','[aria-label*="Précédent" i]','[data-action="previous"]','.previous','.prev'];
                for(let s of sels){ const el=document.querySelector(s); if(el){ el.click(); return true; } }
                if(window.player && typeof window.player.previous==='function'){ window.player.previous(); return true; }
                return false;
            })()`);
            if (res) {
                console.log('Piste précédente (webview)');
                if (prevBtn) { prevBtn.style.transform = 'scale(0.9)'; setTimeout(()=>prevBtn.style.transform='scale(1)',100); }
                return;
            }
        } catch (e) {
            console.error('Erreur previous webview:', e);
        }
    }

    try {
        await window.electron.audio.previousTrack();
        console.log('Piste précédente (système)');
        if (prevBtn) { prevBtn.style.transform = 'scale(0.9)'; setTimeout(()=>prevBtn.style.transform='scale(1)',100); }
    } catch (error) {
        console.error('Erreur piste précédente:', error);
    }
}

/**
 * Piste suivante
 */
async function nextTrack() {
    // Try to trigger next inside webview first
    if (navidromeWebview && navidromeWebview.getURL && navidromeWebview.getURL() !== 'about:blank') {
        try {
            const res = await executeInWebview(`(function(){
                const sels = ['[aria-label*="Next" i]','[aria-label*="Suivant" i]','[data-action="next"]','.next'];
                for(let s of sels){ const el=document.querySelector(s); if(el){ el.click(); return true; } }
                if(window.player && typeof window.player.next==='function'){ window.player.next(); return true; }
                return false;
            })()`);
            if (res) {
                console.log('Piste suivante (webview)');
                if (nextBtn) { nextBtn.style.transform = 'scale(0.9)'; setTimeout(()=>nextBtn.style.transform='scale(1)',100); }
                return;
            }
        } catch (e) {
            console.error('Erreur next webview:', e);
        }
    }

    try {
        await window.electron.audio.nextTrack();
        console.log('Piste suivante (système)');
        if (nextBtn) { nextBtn.style.transform = 'scale(0.9)'; setTimeout(()=>nextBtn.style.transform='scale(1)',100); }
    } catch (error) {
        console.error('Erreur piste suivante:', error);
    }
}

/**
 * Bascule Mute
 */
function toggleMute() {
    isMuted = !isMuted;
    updateMuteIcon();
    console.log(isMuted ? 'Son désactivé' : 'Son activé');
}

/**
 * Change le volume
 */
async function handleVolumeChange(e) {
    currentVolume = parseInt(e.target.value);
    
    if (volumeValue) {
        volumeValue.textContent = currentVolume + '%';
    }

    try {
        await window.electron.audio.setVolume(currentVolume);
        updateVolumeIcon();
        console.log('Volume: ' + currentVolume + '%');
    } catch (error) {
        console.error('Erreur volume:', error);
    }
}

/**
 * Change la sortie audio
 */
async function handleAudioOutputChange(e) {
    const sinkId = e.target.value;
    console.log('Changement sortie audio vers:', sinkId);

    try {
        const success = await window.electron.audio.setOutput(sinkId);
        if (success) {
            currentOutput = sinkId;
            const selectedOption = audioOutput.options[audioOutput.selectedIndex];
            console.log('Sortie audio changée vers: ' + selectedOption.textContent);
        }
    } catch (error) {
        console.error('Erreur changement sortie audio:', error);
    }
}

/**
 * Met à jour l'icône Play/Pause
 */
function updatePlayPauseIcon() {
    if (!playPauseBtn) return;
    
    const icon = playPauseBtn.querySelector('i');
    if (isPlaying) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        playPauseBtn.title = 'Pause';
    } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        playPauseBtn.title = 'Lecture';
    }
}

/**
 * Met à jour l'icône Mute
 */
function updateMuteIcon() {
    if (!muteBtn) return;
    
    const icon = muteBtn.querySelector('i');
    if (isMuted) {
        icon.classList.remove('fa-volume-high', 'fa-volume-low');
        icon.classList.add('fa-volume-xmark');
        muteBtn.title = 'Activer le son';
    } else {
        icon.classList.remove('fa-volume-xmark');
        icon.classList.add('fa-volume-high');
        muteBtn.title = 'Mute';
    }
}

/**
 * Met à jour l'icône du volume selon le niveau
 */
function updateVolumeIcon() {
    if (!muteBtn) return;
    
    const icon = muteBtn.querySelector('i');
    
    if (isMuted) {
        icon.classList.remove('fa-volume-high', 'fa-volume-low');
        icon.classList.add('fa-volume-xmark');
    } else if (currentVolume == 0) {
        icon.classList.remove('fa-volume-high', 'fa-volume-low');
        icon.classList.add('fa-volume-xmark');
    } else if (currentVolume < 30) {
        icon.classList.remove('fa-volume-high', 'fa-volume-xmark');
        icon.classList.add('fa-volume-low');
    } else {
        icon.classList.remove('fa-volume-low', 'fa-volume-xmark');
        icon.classList.add('fa-volume-high');
    }
}

/**
 * Gère les raccourcis clavier
 */
function handleKeyboardShortcuts(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            if (playPauseBtn) playPauseBtn.click();
            break;
        case 'ArrowLeft':
            if (prevBtn) prevBtn.click();
            break;
        case 'ArrowRight':
            if (nextBtn) nextBtn.click();
            break;
        case 'm':
        case 'M':
            if (muteBtn) muteBtn.click();
            break;
    }
}

// ========== GESTION DE LA PAGE PRINCIPALE ==========

/**
 * Initialise les boutons de la page principale
 */
function initMainButtons() {
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            console.log('GPS cliqué');
            showGPSInterface();
        });
    }

    if (bluetoothBtn) {
        bluetoothBtn.addEventListener('click', () => {
            console.log('Bluetooth cliqué');
            showBluetoothInterface();
        });
    }

    if (musicBtn) {
        musicBtn.addEventListener('click', () => {
            console.log('Musique cliqué');
            showMusicInterface();
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            console.log('Paramètres cliqué');
            openSettingsModal();
        });
    }

    if (headerBackBtn) {
        headerBackBtn.addEventListener('click', hideCurrentInterface);
    }

    // Initialiser les contrôles de la modale de paramètres
    initSettingsModal();
}

/**
 * Gestionnaire générique pour les clics menu
 */
function handleMenuClick(feature) {
    console.log(`Accès à: ${feature}`);
    // À implémenter selon vos besoins
    // Afficher une fenêtre, naviguer, etc.
}

async function showMusicInterface() {
    if (musicWebviewContainer) {
        musicWebviewContainer.classList.remove('hidden');
        document.querySelector('.menu-grid').classList.add('hidden');
        if (bluetoothInterface) {
            bluetoothInterface.classList.add('hidden');
        }
        if (gpsContainer) {
            gpsContainer.classList.add('hidden');
        }
        if (headerBackBtn) {
            headerBackBtn.classList.remove('hidden');
        }
        document.querySelector('.main-content')?.classList.add('music-active');
        navidromeActive = true;
        updateAudioStatus();
        // Load Navidrome web UI into webview
        try {
            const serverUrl = await window.electron.navidrome.getServerUrl();
            if (serverUrl && navidromeWebview) {
                navidromeWebview.src = serverUrl.replace(/\/+$/,'');
                navidromeWebview.addEventListener('dom-ready', async () => {
                    startWebviewPolling();

                    // Hide Navidrome toast/popups and overlays
                    try {
                        await navidromeWebview.insertCSS(`
                            .toast, .snackbar, .notification, .notification-overlay,
                            .push-message, .message-overlay, .md-toast, .floating-toast,
                            .player-overlay, .success, .error, .info, .md-modal,
                            .toast-message, .alert, .notification-center {
                                display: none !important;
                            }
                        `);
                    } catch (cssError) {
                        console.error('Erreur insertCSS webview:', cssError);
                    }

                    // Try automatic login using credentials from main process
                    try {
                        const creds = await window.electron.navidrome.getCredentials();
                        if (creds && creds.username && creds.password) {
                            const script = `(function(){
                                try{
                                    const u=${JSON.stringify(creds.username)};
                                    const p=${JSON.stringify(creds.password)};
                                    const user = document.querySelector('input[type=text], input[name=username], input[name=email], input[id*=\\"user\\"], input[id*=\\"email\\"]');
                                    const pass = document.querySelector('input[type=password], input[name=password], input[id*=\\"pass\\"], input[id*=\\"password\\"]');
                                    if(user && pass){
                                        user.focus();
                                        user.value = u;
                                        pass.value = p;
                                        const form = user.form || pass.form || document.querySelector('form');
                                        if(form){
                                            form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
                                            return 'submitted';
                                        }
                                        const btn = document.querySelector('button[type=submit], input[type=submit], button.login, button.sign-in');
                                        if(btn){ btn.click(); return 'clicked'; }
                                    }
                                }catch(e){ return 'err:'+e.message; }
                                return 'no-login';
                            })()`;
                            try {
                                const res = await navidromeWebview.executeJavaScript(script, true);
                                console.log('Auto-login result:', res);
                            } catch (e) {
                                console.error('Erreur auto-login executeJavaScript:', e);
                            }
                        }
                    } catch (e) {
                        console.error('Erreur récupération credentials:', e);
                    }
                });
            }
        } catch (e) {
            console.error('Erreur ouverture Navidrome:', e);
            setMusicStatus('Impossible d\'ouvrir Navidrome.');
        }
    }
}

function hideMusicInterface() {
    if (musicWebviewContainer) {
        musicWebviewContainer.classList.add('hidden');
        document.querySelector('.menu-grid').classList.remove('hidden');
        if (headerBackBtn) {
            headerBackBtn.classList.add('hidden');
        }
        document.querySelector('.main-content')?.classList.remove('music-active');
        stopWebviewPolling();
        navidromeActive = false;
        updateAudioStatus();
    }
}

function showGPSInterface() {
    if (gpsContainer) {
        gpsContainer.classList.remove('hidden');
        document.querySelector('.menu-grid').classList.add('hidden');
        if (musicWebviewContainer) {
            musicWebviewContainer.classList.add('hidden');
        }
        if (bluetoothInterface) {
            bluetoothInterface.classList.add('hidden');
        }
        if (headerBackBtn) {
            headerBackBtn.classList.remove('hidden');
        }
        document.querySelector('.main-content')?.classList.add('gps-active');
        initGPSMap();
        setTimeout(() => {
            if (gpsMap) {
                gpsMap.invalidateSize();
            }
        }, 150);
        // Charger les points GPS stockés depuis le serveur projet-web
        fetchStoredGpsPoints();
        window.electron.gps.start().then((result) => {
            console.log('GPS start result', result);
            if (!result?.success) {
                updateGPSStatus(result?.message || 'Impossible de démarrer le GPS');
            }
        }).catch((err) => {
            console.error('GPS start error', err);
            updateGPSStatus('Erreur GPS: ' + (err.message || err));
        });
    }
}

function hideGPSInterface() {
    if (gpsContainer) {
        gpsContainer.classList.add('hidden');
        document.querySelector('.menu-grid').classList.remove('hidden');
        if (headerBackBtn) {
            headerBackBtn.classList.add('hidden');
        }
        document.querySelector('.main-content')?.classList.remove('gps-active');
        // Ne pas arrêter le GPS ici : il doit continuer à tourner en arrière-plan.
    }
}

function initGPSMap() {
    if (!gpsMapElement) return;
    if (!gpsMap) {
        gpsMap = L.map(gpsMapElement, { zoomControl: true, attributionControl: false }).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(gpsMap);
    }
}

async function fetchStoredGpsPoints() {
    try {
        // Try to login to projet-web using credentials from .env (exposed by main)
        const creds = await window.electron?.auth?.getCredentials?.();
        let points = null;

        if (creds && creds.user && creds.pass) {
            try {
                const loginRes = await fetch('https://projet-web-6s9w.onrender.com/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: creds.user, password: creds.pass })
                });
                const loginJson = await loginRes.json();
                if (loginRes.ok && loginJson && loginJson.success && loginJson.data && loginJson.data.token) {
                    const token = loginJson.data.token;
                    const res = await fetch('https://projet-web-6s9w.onrender.com/api/users/gps?limit=5', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        const json = await res.json();
                        if (json && Array.isArray(json.data)) {
                            // Ensure chronological order (oldest first)
                            points = json.data.slice().reverse();
                        }
                    }
                } else {
                    console.warn('Login failed for backend credentials', loginJson && loginJson.message);
                }
            } catch (err) {
                console.error('Error logging in to backend:', err);
            }
        }

        // Fallback to public endpoint (limited to 5)
        if (!points) {
            try {
                const res = await fetch('https://projet-web-6s9w.onrender.com/api/public/gps?limit=5');
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.success && Array.isArray(json.data)) {
                        points = json.data; // public route already returns chronological order
                    }
                }
            } catch (err) {
                console.error('Fallback public fetch error:', err);
            }
        }

        if (points && Array.isArray(points) && points.length > 0) {
            renderStoredGpsPoints(points);
        }
    } catch (err) {
        console.error('Erreur récupération points stockés:', err);
    }
}

function renderStoredGpsPoints(points) {
    if (!gpsMap || !points || points.length === 0) return;

    // Clear previous
    if (storedPolyline) {
        gpsMap.removeLayer(storedPolyline);
        storedPolyline = null;
    }
    storedMarkers.forEach(m => gpsMap.removeLayer(m));
    storedMarkers = [];

    const coords = points.map(p => [p.latitude, p.longitude]);
    storedPolyline = L.polyline(coords, { color: '#3b82f6', weight: 3, opacity: 0.9 }).addTo(gpsMap);

    // Start marker
    const start = points[0];
    const end = points[points.length - 1];
    const startMarker = L.marker([start.latitude, start.longitude]).addTo(gpsMap).bindPopup(`<b>Départ</b><br>${start.latitude.toFixed(6)}, ${start.longitude.toFixed(6)}`);
    const endMarker = L.marker([end.latitude, end.longitude]).addTo(gpsMap).bindPopup(`<b>Arrivée</b><br>${end.latitude.toFixed(6)}, ${end.longitude.toFixed(6)}`);
    storedMarkers.push(startMarker, endMarker);

    try {
        gpsMap.fitBounds(storedPolyline.getBounds(), { padding: [20, 20] });
    } catch (e) {
        console.warn('fitBounds failed', e);
    }
}

function updateGPSStatus(message) {
    if (gpsStatusBar) {
        if (message && message.startsWith('Erreur')) {
            gpsStatusBar.textContent = message;
        } else {
            gpsStatusBar.textContent = 'GPS: actif';
        }
    }
}

function updateGPSPosition(position) {
    if (!position || typeof position.latitude !== 'number' || typeof position.longitude !== 'number') return;
    updateGPSStatus('GPS actif');
    if (!gpsMap) initGPSMap();
    const latlng = [position.latitude, position.longitude];
    gpsMap.setView(latlng, position.zoom || 16);
    if (gpsMarker) gpsMarker.setLatLng(latlng);
    if (gpsAccuracyCircle) {
        gpsAccuracyCircle.setLatLng(latlng);
        gpsAccuracyCircle.setRadius(position.accuracy || 15);
    }
}

// ========== GESTION DE L'INTERFACE BLUETOOTH ==========

/**
 * Affiche l'interface Bluetooth
 */
function showBluetoothInterface() {
    if (bluetoothInterface) {
        bluetoothInterface.classList.remove('hidden');
        document.querySelector('.menu-grid').classList.add('hidden');
        if (musicWebviewContainer) {
            musicWebviewContainer.classList.add('hidden');
        }
        if (gpsContainer) {
            gpsContainer.classList.add('hidden');
        }
        if (headerBackBtn) {
            headerBackBtn.classList.remove('hidden');
        }
        refreshConnectedDevices();
    }
}

/**
 * Cache l'interface Bluetooth
 */
function hideBluetoothInterface() {
    if (bluetoothInterface) {
        bluetoothInterface.classList.add('hidden');
        document.querySelector('.menu-grid').classList.remove('hidden');
        if (headerBackBtn) {
            headerBackBtn.classList.add('hidden');
        }
        // NE PAS désactiver la découverte - rester connecté en arrière-plan
    }
}

/**
 * Cache l'interface actuelle et retour au menu principal
 */
function hideCurrentInterface() {
    if (gpsContainer && !gpsContainer.classList.contains('hidden')) {
        hideGPSInterface();
    } else if (musicWebviewContainer && !musicWebviewContainer.classList.contains('hidden')) {
        hideMusicInterface();
    } else if (bluetoothInterface && !bluetoothInterface.classList.contains('hidden')) {
        hideBluetoothInterface();
    }
}

// ========== GESTION DE LA DÉCOUVERTE BLUETOOTH AUTOMATIQUE ==========

/**
 * Initialise la découverte Bluetooth automatique en arrière-plan
 */
async function initAutoBluetoothDiscovery() {
    try {
        // Appeler le backend pour activer la découverte (script bt_pairing.sh)
        const success = await window.electron?.bluetooth?.enableDiscovery?.();
        
        if (success) {
            discoveryActive = true;
            console.log('Découverte Bluetooth automatique activée');
            
            // Rafraîchir la liste des appareils tous les 3 secondes en arrière-plan
            setInterval(refreshConnectedDevices, 3000);
            
            // Rafraîchissement initial
            refreshConnectedDevices();
        }
    } catch (error) {
        console.error('Erreur initialisation découverte Bluetooth:', error);
    }
}

/**
 * Écoute les changements de connexion Bluetooth
 */
async function listenBluetoothConnectionChanges() {
    if (window.electron?.bluetooth?.listenConnection) {
        try {
            await window.electron.bluetooth.listenConnection((status) => {
                console.log('État Bluetooth:', status);
                bluetoothConnected = (status === 'connected');
                if (bluetoothConnected) {
                    bluetoothPlaying = true;
                } else {
                    bluetoothPlaying = false;
                }
                updateAudioStatus();
                refreshConnectedDevices();
            });
        } catch (error) {
            console.error('Erreur écoute connexion Bluetooth:', error);
        }
    }
}

/**
 * Met à jour le statut audio dans la barre du bas
 */
function updateAudioStatus() {
    const statusDisplay = document.getElementById('audioStatusDisplay');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
    if (!statusDisplay) return;

    let icon = '<i class="fas fa-music"></i>';
    let text = 'Aucune source';

    if (bluetoothConnected && bluetoothPlaying) {
        icon = '<i class="fas fa-bluetooth" style="color: #3b82f6;"></i>';
        text = 'Bluetooth en cours';
    } else if (navidromeActive && isPlaying) {
        icon = '<i class="fas fa-music" style="color: #10b981;"></i>';
        text = 'Navidrome en cours';
    } else if (bluetoothConnected) {
        icon = '<i class="fas fa-bluetooth" style="color: #9ca3af;"></i>';
        text = 'Bluetooth connecté';
    } else if (navidromeActive) {
        icon = '<i class="fas fa-music" style="color: #9ca3af;"></i>';
        text = 'Navidrome prêt';
    }

    if (statusIcon) statusIcon.innerHTML = icon;
    if (statusText) statusText.textContent = text;
}

/**
 * Rafraîchit la liste des appareils connectés
 */
async function refreshConnectedDevices() {
    try {
        bluetoothDevices = await window.electron?.bluetooth?.getConnectedDevices?.() || [];
        
        if (devicesList) {
            displayBluetoothDevices(bluetoothDevices);
        }
    } catch (error) {
        console.error('Erreur refresh appareils:', error);
    }
}

/**
 * Affiche la liste des appareils Bluetooth
 */
function displayBluetoothDevices(devices) {
    if (!devicesList) return;

    // Mettre à jour le statut de découverte
    if (discoveryStatus) {
        if (discoveryActive) {
            discoveryStatus.textContent = '🔍 Recherche d\'appareils...';
            discoveryStatus.style.color = '#3b82f6';
        } else {
            discoveryStatus.textContent = 'Découverte inactive';
            discoveryStatus.style.color = 'var(--text-secondary)';
        }
    }

    devicesList.innerHTML = '';

    if (devices.length === 0) {
        devicesList.innerHTML = '<div class="no-devices">En attente d\'un appareil à connecter...</div>';
        return;
    }

    devices.forEach((device, index) => {
        const deviceElement = document.createElement('div');
        deviceElement.className = `device-item ${device.connected ? 'connected' : ''}`;
        
        const statusIcon = device.connected ? '✓' : '○';
        const statusText = device.connected ? 'Connecté' : 'Non connecté';
        
        deviceElement.innerHTML = `
            <div class="device-info">
                <div class="device-name">${statusIcon} ${device.name || 'Appareil inconnu'}</div>
                <div class="device-address">${device.address || ''}</div>
                <div class="device-status">
                    <span class="${device.connected ? 'connected-badge' : 'disconnected-badge'}">${statusText}</span>
                </div>
            </div>
            <div class="device-actions">
                ${device.connected ? 
                    `<button class="disconnect-btn" onclick="disconnectBTDevice('${device.address}')">
                        <i class="fas fa-link-slash"></i> Déconnecter
                    </button>` :
                    `<button class="connect-btn" onclick="connectBTDevice('${device.address}')">
                        <i class="fas fa-link"></i> Connecter
                    </button>`
                }
            </div>
        `;
        devicesList.appendChild(deviceElement);
    });

    // Mettre à jour les appareils connectés
    updateConnectedDevices();
}

/**
 * Connecte un appareil Bluetooth
 */
async function connectBTDevice(address) {
    console.log(`Connexion à ${address}`);
    
    try {
        const success = await window.electron?.bluetooth?.connectDevice?.(address);
        if (success) {
            selectedBluetoothDevice = address;
            bluetoothConnected = true;
            bluetoothPlaying = true;
            updateAudioStatus();
            refreshConnectedDevices(); // Rafraîchir la liste
        }
    } catch (error) {
        console.error('Erreur connexion Bluetooth:', error);
        alert(`Erreur: ${error.message}`);
    }
}

/**
 * Déconnecte un appareil Bluetooth
 */
async function disconnectBTDevice(address) {
    console.log(`Déconnexion de ${address}`);
    
    try {
        const success = await window.electron?.bluetooth?.disconnectDevice?.(address);
        if (success) {
            if (selectedBluetoothDevice === address) {
                selectedBluetoothDevice = null;
                bluetoothConnected = false;
                bluetoothPlaying = false;
                isAudioRouted = false;
                updateAudioStatus();
            }
            refreshConnectedDevices(); // Rafraîchir la liste
        }
    } catch (error) {
        console.error('Erreur déconnexion Bluetooth:', error);
    }
}

/**
 * Route l'audio Bluetooth
 */
async function routeBluetoothAudio() {
    if (!selectedBluetoothDevice) {
        alert('Aucun appareil Bluetooth sélectionné');
        return;
    }

    try {
        const success = await window.electron?.bluetooth?.routeAudio?.(selectedBluetoothDevice);
        if (success) {
            isAudioRouted = true;
            if (routingStatus) {
                routingStatus.textContent = 'Audio routé ✓';
                routingStatus.style.color = '#00ff00';
            }
        }
    } catch (error) {
        console.error('Erreur routage audio:', error);
        if (routingStatus) {
            routingStatus.textContent = 'Erreur routage';
            routingStatus.style.color = '#ff0000';
        }
    }
}

/**
 * Met à jour les appareils connectés
 */
function updateConnectedDevices() {
    const connectedDevices = bluetoothDevices.filter(d => d.connected);
    
    if (connectedDevices.length > 0) {
        selectedBluetoothDevice = connectedDevices[0].address;
        if (routeAudioBtn) {
            routeAudioBtn.disabled = false;
        }
    }
}

// ========== GESTION DE LA MODALE PARAMÈTRES ==========

/**
 * Initialise les contrôles de la modale de paramètres
 */
function initSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const settingsForm = document.getElementById('settingsForm');

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettingsModal);
    }

    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Fermer la modale en cliquant en dehors
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }

    // Charger les paramètres au démarrage de la modale
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSettings();
        });
    }
}

/**
 * Ouvre la modale de paramètres et charge les valeurs actuelles
 */
async function openSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal) return;

    try {
        // Charger les valeurs du .env
        const settings = await window.electron.settings.loadSettings();
        
        if (settings) {
            // Navidrome User
            const navidromeUserInput = document.getElementById('navidromeUserInput');
            if (navidromeUserInput && settings.NAVIDROME_USER) {
                navidromeUserInput.value = settings.NAVIDROME_USER;
            }

            // Navidrome Password
            const navidromePassInput = document.getElementById('navidromePassInput');
            if (navidromePassInput && settings.NAVIDROME_PASS) {
                navidromePassInput.value = settings.NAVIDROME_PASS;
            }

            // Backend User
            const backendUserInput = document.getElementById('backendUserInput');
            if (backendUserInput && settings.BACKEND_USER) {
                backendUserInput.value = settings.BACKEND_USER;
            }

            // Backend Password
            const backendPassInput = document.getElementById('backendPassInput');
            if (backendPassInput && settings.BACKEND_PASS) {
                backendPassInput.value = settings.BACKEND_PASS;
            }

            // GPS Serial Path
            const gpsPathInput = document.getElementById('gpsPathInput');
            if (gpsPathInput && settings.GPS_SERIAL_PATH) {
                gpsPathInput.value = settings.GPS_SERIAL_PATH;
            }
        }

        // Afficher la modale
        settingsModal.classList.remove('hidden');
    } catch (error) {
        console.error('Erreur chargement paramètres:', error);
        alert('Erreur lors du chargement des paramètres');
    }
}

/**
 * Ferme la modale de paramètres
 */
function closeSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
}

/**
 * Sauvegarde les paramètres modifiés
 */
async function saveSettings() {
    try {
        // Récupérer les valeurs du formulaire
        const navidromeUserInput = document.getElementById('navidromeUserInput');
        const navidromePassInput = document.getElementById('navidromePassInput');
        const backendUserInput = document.getElementById('backendUserInput');
        const backendPassInput = document.getElementById('backendPassInput');
        const gpsPathInput = document.getElementById('gpsPathInput');

        const settings = {
            NAVIDROME_USER: navidromeUserInput?.value || '',
            NAVIDROME_PASS: navidromePassInput?.value || '',
            BACKEND_USER: backendUserInput?.value || '',
            BACKEND_PASS: backendPassInput?.value || '',
            GPS_SERIAL_PATH: gpsPathInput?.value || '/dev/ttyACM0'
        };

        // Sauvegarder les paramètres via IPC
        const success = await window.electron.settings.saveSettings(settings);

        if (success) {
            console.log('Paramètres sauvegardés avec succès');
            alert('Paramètres sauvegardés avec succès!');
            closeSettingsModal();
        } else {
            alert('Erreur lors de la sauvegarde des paramètres');
        }
    } catch (error) {
        console.error('Erreur sauvegarde paramètres:', error);
        alert('Erreur: ' + error.message);
    }
}
