# 🚀 Guide de Déploiement sur Render

## Configuration du service Render

### Étapes de déploiement:

1. **Connectez-vous à Render** → https://render.com

2. **Créez un nouveau Web Service**
   - Connectez votre dépôt GitHub
   - Sélectionnez votre branche

3. **Configuration du service:**
   - **Build Command:** `npm install` (optionnel, déjà géré par startRender.js)
   - **Start Command:** `npm start`
   - **Runtime:** Node
   - **Node Version:** 18.20.0 (ou plus récente)

4. **Variables d'environnement (.env)**
   Ajoutez les variables nécessaires dans les Settings → Environment:
   ```
   NODE_ENV=production
   MONGODB_URI=votre_uri_mongo
   JWT_SECRET=votre_secret_jwt
   # Autres variables selon votre config...
   ```

5. **Ports:**
   - Frontend: Port 5000 (interne)
   - Backend: Port 3000 (interne)
   - Render expose automatiquement sur le port 10000+ (voir URL du service)

6. **Deploy:**
   - Cliquez sur "Deploy Service"
   - Render auto-redéploiera à chaque push sur la branche principale

## 📄 Fichiers de configuration

- **Procfile** → Définit la commande de démarrage
- **startRender.js** → Script qui:
  1. ✅ Installe les dépendances frontend
  2. ✅ Installe les dépendances backend
  3. ✅ Build le frontend Angular
  4. ✅ Lance le backend (Node.js)
  5. ✅ Lance le frontend (ng serve)

- **.nvmrc** → Spécifie Node.js 18.20.0

## 🔗 Points d'accès

Une fois déployé sur Render:
- **Frontend:** `https://votre-app.onrender.com`
- **Backend API:** `https://votre-app.onrender.com:3000/api` (ou configure CORS)

## 💡 Notes importantes

- ⚠️ Le build du frontend prend environ 2-3 minutes
- 💾 Render garde les fichiers buildés en cache
- 🔄 Redéployment automatique sur push
- 📊 Surveillez les logs dans Dashboard → Logs

## 🛠️ Tests locaux

Pour tester localement:
```bash
# Avec deux terminaux séparés:
node start.js

# Ou avec le script Render:
node startRender.js
```
