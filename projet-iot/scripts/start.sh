#!/bin/bash

# Lancer le GPS et l'application Electron
# Usage: sudo bash scripts/start.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[CarPlay] Démarrage du GPS et de l'application..."

GPS_FIFO="/tmp/carplay_gps.fifo"

# Créer le FIFO s'il n'existe pas
if [[ ! -p "$GPS_FIFO" ]]; then
    rm -f "$GPS_FIFO"
    mkfifo "$GPS_FIFO"
    echo "[CarPlay] FIFO créé : $GPS_FIFO"
fi

# Lancer le GPS en arrière-plan
echo "[CarPlay] Démarrage du lecteur GPS..."
bash "$SCRIPT_DIR/read_gps.sh" "${GPS_SERIAL_PATH:-/dev/ttyACM0}" > "$GPS_FIFO" 2>&1 &
GPS_PID=$!
echo "[CarPlay] GPS PID=$GPS_PID"

# Trap pour nettoyer à l'arrêt
cleanup() {
    echo "[CarPlay] Arrêt du GPS..."
    kill $GPS_PID 2>/dev/null || true
    sleep 0.5
    rm -f "$GPS_FIFO"
}
trap cleanup EXIT

# Attendre un peu que le GPS commence à fonctionner
sleep 1

# Lancer l'application Electron
cd "$PROJECT_DIR"
echo "[CarPlay] Lancement de l'application Electron..."
ELECTRON_BIN="$PROJECT_DIR/node_modules/.bin/electron"
if [[ ! -x "$ELECTRON_BIN" ]]; then
    echo "[CarPlay] Erreur: electron non trouvé dans node_modules" >&2
    exit 1
fi

exec "$ELECTRON_BIN" . "$GPS_FIFO"
