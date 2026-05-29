#!/bin/bash

# Lire et afficher les données GPS NMEA depuis un device série.
# Usage:
#   bash scripts/read_gps.sh [device]
# Ex:
#   bash scripts/read_gps.sh /dev/ttyACM0

set -euo pipefail

DEVICE="${1:-${GPS_SERIAL_PATH:-/dev/ttyACM0}}"

if [[ ! -e "$DEVICE" ]]; then
  echo "Erreur: périphérique non trouvé : $DEVICE" >&2
  exit 1
fi

if [[ ! -r "$DEVICE" ]]; then
  echo "Erreur: périphérique non lisible : $DEVICE" >&2
  exit 2
fi

printf 'GPS: utilisation de %s\n' "$DEVICE" >&2

if command -v stty >/dev/null 2>&1; then
  printf 'GPS: configuration du port série 9600 8N1\n' >&2
  stty -F "$DEVICE" 9600 cs8 -cstopb -parenb || true
fi

printf 'GPS: lecture des données depuis %s...\n' "$DEVICE" >&2

# Lire le device directement et afficher sur stdout (sans buffering)
stdbuf -oL cat "$DEVICE"
