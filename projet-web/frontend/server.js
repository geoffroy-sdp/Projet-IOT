const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve static files from dist
const distPath = path.join(__dirname, 'dist', 'frontend', 'browser');
app.use(express.static(distPath));

// Handle routing - any request to non-file routes goes to index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Frontend server running on http://${HOST}:${PORT}`);
});
