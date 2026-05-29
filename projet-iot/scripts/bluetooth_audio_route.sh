#!/bin/bash

# Routage audio Bluetooth vers le périphérique de sortie configuré
# Ce script configure PulseAudio pour router les flux Bluetooth vers la sortie audio appropriée

set -e

echo "=== Configuration routage audio Bluetooth ==="

# Fonction pour attendre que le service soit prêt
wait_for_service() {
    local service=$1
    local timeout=${2:-10}
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if systemctl is-active --quiet $service; then
            echo "✓ Service $service est actif"
            return 0
        fi
        sleep 0.5
        elapsed=$((elapsed + 1))
    done
    
    echo "⚠ Service $service n'a pas pu être vérifié"
    return 1
}

# Vérifier que PulseAudio est disponible
if ! command -v pactl &> /dev/null; then
    echo "✗ PulseAudio (pactl) non disponible"
    exit 1
fi

echo "Attente de la stabilisation des services..."
sleep 2

# Lister les sources de sortie disponibles
echo "Périphériques de sortie disponibles :"
SINKS=$(pactl list short sinks)
echo "$SINKS"

# Identifier le périphérique Jack (hw:1,0) ou la sortie principale
JACK_SINK=$(echo "$SINKS" | grep -E 'hw:1,0|alsa_output|USB' | head -1 | awk '{print $1}' || true)

if [ -z "$JACK_SINK" ]; then
    # Utiliser le sink par défaut
    JACK_SINK=$(pactl info | grep "Default Sink" | awk '{print $3}' || true)
    
    if [ -z "$JACK_SINK" ]; then
        JACK_SINK=$(echo "$SINKS" | head -1 | awk '{print $1}' || true)
    fi
fi

if [ -z "$JACK_SINK" ]; then
    echo "✗ Aucun périphérique de sortie trouvé"
    exit 1
fi

echo "Périphérique cible identifié: $JACK_SINK"

# Récupérer les flux d'entrée Bluetooth actuels
echo "Flux Bluetooth détectés:"
pactl list short sink-inputs | grep -i "bluetooth\|bluez\|a2dp" || echo "Aucun flux Bluetooth actuellement"

# Configurer le routage pour les futurs flux
# Cette commande subscribe aux changements et route automatiquement
(pactl subscribe; while read -r line; do
    if [[ $line == *"sink-input"* ]]; then
        sleep 0.5
        INPUTS=$(pactl list short sink-inputs)
        echo "$INPUTS" | grep -i "bluetooth\|bluez\|a2dp" | while read -r input_line; do
            INPUT_ID=$(echo "$input_line" | awk '{print $1}')
            INPUT_NAME=$(echo "$input_line" | awk '{print $NF}')
            echo "Routage du flux Bluetooth $INPUT_ID ($INPUT_NAME) vers $JACK_SINK"
            pactl move-sink-input "$INPUT_ID" "$JACK_SINK" 2>/dev/null || true
        done
    fi
done) &

ROUTE_PID=$!
echo "Service de routage démarré (PID: $ROUTE_PID)"

# Garder le script en attente
sleep 2
echo "Configuration du routage audio Bluetooth terminée"

# Retirer ce message de fond pour que le script se termine correctement
kill $ROUTE_PID 2>/dev/null || true
wait $ROUTE_PID 2>/dev/null || true

exit 0
