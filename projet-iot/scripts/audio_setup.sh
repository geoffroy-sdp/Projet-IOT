#!/bin/bash

# Configuration audio initiale pour CarPlay
# Ce script initialise les périphériques audio et configure PulseAudio

set -e

echo "=== Initialisation audio CarPlay ==="

# Vérifier si PulseAudio est en cours d'exécution
if ! pgrep -x "pulseaudio" > /dev/null; then
    echo "Démarrage de PulseAudio..."
    pulseaudio --start
    sleep 1
fi

# Vérifier la disponibilité d'ALSA
if command -v amixer &> /dev/null; then
    echo "✓ ALSA (amixer) est disponible"
else
    echo "✗ ALSA (amixer) non disponible"
fi

# Vérifier la disponibilité de PulseAudio
if command -v pactl &> /dev/null; then
    echo "✓ PulseAudio (pactl) est disponible"
    
    # Lister les périphériques de sortie
    echo "Périphériques de sortie audio :"
    pactl list short sinks || true
    
    # Lister les périphériques d'entrée
    echo "Périphériques d'entrée audio :"
    pactl list short sources || true
else
    echo "✗ PulseAudio (pactl) non disponible"
fi

echo "Configuration audio terminée"
