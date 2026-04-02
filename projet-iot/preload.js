const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // APIs futures peuvent être ajoutées ici
});
