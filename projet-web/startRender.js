const { spawn } = require('child_process');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');
const backendPath = path.join(__dirname, 'backend');

// Fonction pour exécuter des commandes
const execCommand = (command, args, cwd, description) => {
  return new Promise((resolve, reject) => {
    console.log(`${description}...`);
    const child = spawn(command, args, {
      cwd: cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${description} terminé\n`);
        resolve();
      } else {
        reject(new Error(`${description} échoué avec le code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};

// Fonction principale
const main = async () => {
  try {
    // 1. Installer les dépendances du backend
    await execCommand('npm', ['install'], backendPath, 'Installation des dépendances backend');

    // 2. Installer les dépendances du frontend
    await execCommand('npm', ['install'], frontendPath, 'Installation des dépendances frontend');

    // 3. Builder le frontend
    console.log('🔨 Build du frontend Angular...');
    await execCommand('npm', ['run', 'build'], frontendPath, 'Build du frontend');

    // 4. Lancer les deux services en parallèle
    
    // Backend
    const backend = spawn('node', ['main.js'], {
      cwd: backendPath,
      stdio: 'inherit',
    });

    // Frontend (servir les fichiers buildés)
    const frontend = spawn('npm', ['run', 'start:dev'], {
      cwd: frontendPath,
      stdio: 'inherit',
    });

    // Gérer l'arrêt des processus
    process.on('SIGTERM', () => {
      console.log('\nArrêt des services...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('\nArrêt des services...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

main();


