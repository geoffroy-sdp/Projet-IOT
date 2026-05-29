const { exec, spawn } = require('child_process');
const path = require('path');

let mirroringProcess = null;
let currentDeviceId = null;

/**
 * Détecte les appareils Android connectés via USB
 */
function getConnectedDevices(callback) {
    exec('adb devices', (error, stdout, stderr) => {
        if (error) {
            console.error('Erreur adb:', error);
            callback([]);
            return;
        }
        
        const lines = stdout.split('\n');
        const devices = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.includes('List of attached devices')) {
                const parts = line.split('\t');
                if (parts.length >= 2 && parts[1] === 'device') {
                    devices.push(parts[0]);
                }
            }
        }
        
        callback(devices);
    });
}

/**
 * Lance scrcpy pour le mirroring d'écran
 */
function startMirroring(deviceId, onError) {
    console.log(`Démarrage du mirroring pour l'appareil: ${deviceId}`);
    
    if (mirroringProcess) {
        console.log('Un processus de mirroring est déjà actif');
        return;
    }
    
    currentDeviceId = deviceId;
    
    // Commande scrcpy avec options
    const args = [
        '-s', deviceId,
        '--window-title=Phone Screen',
        '--window-x=0',
        '--window-y=0',
        '--window-width=240',
        '--window-height=600',
        '--window-borderless',
        '--stay-awake',
        '--video-bit-rate=4M',
        '--max-fps=30'
    ];
    
    console.log(`Commande: scrcpy ${args.join(' ')}`);
    
    mirroringProcess = spawn('scrcpy', args);
    
    // Éteindre l'écran du téléphone après 2 secondes
    setTimeout(() => {
        console.log('Extinction de l\'écran du téléphone');
        exec(`adb -s ${deviceId} shell input keyevent 26`, (error) => {
            if (error) {
                console.error('Erreur extinction écran:', error);
            } else {
                console.log('Écran du téléphone éteint');
            }
        });
    }, 2000);
    
    mirroringProcess.on('error', (error) => {
        console.error('Erreur scrcpy:', error.message);
        mirroringProcess = null;
        currentDeviceId = null;
        if (onError) onError(`Erreur scrcpy: ${error.message}`);
    });
    
    mirroringProcess.on('close', (code) => {
        console.log(`Processus scrcpy fermé avec le code: ${code}`);
        mirroringProcess = null;
        currentDeviceId = null;
    });
    
    mirroringProcess.stderr.on('data', (data) => {
        console.log(`scrcpy stderr: ${data.toString()}`);
    });
    
    mirroringProcess.stdout.on('data', (data) => {
        console.log(`scrcpy stdout: ${data.toString()}`);
    });
}

/**
 * Stoppe le mirroring
 */
function stopMirroring() {
    console.log('Arrêt du mirroring');
    
    if (mirroringProcess) {
        try {
            mirroringProcess.kill();
        } catch (e) {
            console.error('Erreur lors de l\'arrêt du mirroring:', e);
        }
        mirroringProcess = null;
    }
    
    currentDeviceId = null;
}

/**
 * Retourne l'état du mirroring
 */
function getMirroringStatus() {
    return {
        isActive: mirroringProcess !== null,
        deviceId: currentDeviceId
    };
}

module.exports = {
    getConnectedDevices,
    startMirroring,
    stopMirroring,
    getMirroringStatus
};
