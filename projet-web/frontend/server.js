const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve static files from dist
const distPath = path.join(__dirname, 'dist', 'frontend', 'browser');

// Check if dist exists, if not build it
if (!fs.existsSync(distPath)) {
  console.log('Building Angular app...');
  try {
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

console.log(`Serving files from: ${distPath}`);
app.use(express.static(distPath));

// Handle routing - any request to non-file routes goes to index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Frontend server running on http://${HOST}:${PORT}`);
});
