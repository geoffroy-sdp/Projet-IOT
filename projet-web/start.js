const { spawn } = require('child_process');
const path = require('path');

const frontendPath = path.join(__dirname, 'frontend');
const backendPath = path.join(__dirname, 'backend');

console.log('Démarrage de l\'application avec 2 terminaux séparés...\n');

// Windows: ouvre deux terminaux séparés
if (process.platform === 'win32') {

  // Terminal 1: Frontend
  spawn('cmd', ['/c', 'start cmd /k npm run start:dev'], {
    cwd: frontendPath,
    stdio: 'inherit',
  });

  // Terminal 2: Backend (après un délai)
  setTimeout(() => {
    spawn('cmd', ['/c', 'start cmd /k npm run start:dev'], {
      cwd: backendPath,
      stdio: 'inherit',
    });
    
    // Arrêt du script principal après lancement des 2 terminaux
    setTimeout(() => {
      console.log('\nAccès:');
      console.log('   Frontend: http://localhost:5000');
      console.log('   Backend: http://localhost:3000/api\n');
      process.exit(0);
    }, 500);
  }, 3000);
}
// Linux/Mac: utilise gnome-terminal ou iterm2
else if (process.platform === 'linux') {
  spawn('gnome-terminal', ['--', 'bash', '-c', 'cd ' + frontendPath + ' && npm run start:dev; bash']);
  
  setTimeout(() => {
    spawn('gnome-terminal', ['--', 'bash', '-c', 'cd ' + backendPath + ' && npm run start:dev; bash']);
    setTimeout(() => {
      console.log('\n2 terminaux lancés avec succès');
      process.exit(0);
    }, 500);
  }, 3000);

} else if (process.platform === 'darwin') {
  spawn('open', ['-a', 'Terminal', frontendPath]);
  setTimeout(() => {
    spawn('open', ['-a', 'Terminal', backendPath]);
    setTimeout(() => {
      process.exit(0);
    }, 500);
  }, 3000);

}
