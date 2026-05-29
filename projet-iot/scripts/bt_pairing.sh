#!/bin/bash

# Démarrer Bluetooth sans demander de mot de passe
# Les permissions doivent être configurées dans sudoers pour éviter les prompts

# Essayer avec sudo en silence, sinon appeler directement
sudo -n systemctl start bluetooth 2>/dev/null || \
sudo systemctl start bluetooth 2>/dev/null || \
systemctl start bluetooth 2>/dev/null

sleep 1

# Configurer Bluetooth avec bluetoothctl
bluetoothctl << EOF
power on
agent NoInputNoOutput
default-agent
discoverable on
discoverable-timeout 0
pairable on
EOF

exit 0
