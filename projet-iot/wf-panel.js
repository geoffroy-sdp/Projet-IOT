const { spawn } = require("child_process");

// Intervalle entre chaque exécution (en ms)
const INTERVAL = 2000; // toutes les 2 secondes

function killPanel() {
    const cmd = spawn("sudo", ["pkill", "wf-panel-pi"]);

    cmd.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
    });

    cmd.stderr.on("data", data => {
        console.error(`stderr: ${data}`);
    });

    cmd.on("close", code => {
        console.log(`Commande terminée avec le code ${code}`);
    });
}

// Boucle infinie
setInterval(killPanel, INTERVAL);

console.log("Script lancé : exécution continue de 'sudo pkill wf-panel-pi'...");
