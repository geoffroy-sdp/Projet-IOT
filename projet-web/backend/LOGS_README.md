# 📝 Système de Logging

Ce projet utilise un système de logging avancé qui enregistre différents types d'événements dans des fichiers séparés pour faciliter le monitoring et le debugging.

## 📁 Fichiers de logs

Le système crée automatiquement un dossier `logs/` à la racine du projet contenant :

- **`error.log`** - Erreurs de l'application (exceptions, erreurs de base de données, etc.)
- **`requests.log`** - Toutes les requêtes HTTP avec détails (méthode, URL, temps de réponse, IP, etc.)
- **`security.log`** - Événements de sécurité (tentatives de connexion, accès non autorisés, etc.)
- **`combined.log`** - Logs généraux et warnings
- **`debug.log`** - Logs de debug (uniquement en mode développement)

## 🚀 Utilisation

### Démarrage automatique
Le système de logging s'initialise automatiquement au démarrage du serveur :
```bash
npm start
```

### Consultation des logs via API
Vous pouvez consulter les logs via des endpoints protégés (clé admin requise) :

```bash
# Consulter les erreurs
GET /api/logs/error
Headers: x-admin-key: votre-cle-admin

# Consulter les requêtes
GET /api/logs/requests

# Consulter la sécurité
GET /api/logs/security

# Consulter tous les logs
GET /api/logs/combined

# Consulter les logs de debug
GET /api/logs/debug
```

### Lecture directe des fichiers
Les fichiers sont situés dans le dossier `logs/` :
```bash
tail -f logs/error.log      # Suivre les erreurs en temps réel
tail -f logs/security.log   # Surveiller la sécurité
grep "FAILED_LOGIN" logs/security.log  # Rechercher les échecs de connexion
```

## 📊 Format des logs

Tous les logs sont au format JSON pour faciliter l'analyse :

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "hostname": "server-01",
  "pid": 12345,
  "error": "Connection timeout",
  "stack": "...",
  "userId": "507f1f77bcf86cd799439011"
}
```

## 🔒 Événements de sécurité loggés

- **FAILED_LOGIN_ATTEMPT** - Tentative de connexion échouée
- **UNAUTHORIZED_ACCESS** - Accès non autorisé (401/403)
- **MISSING_ADMIN_KEY** - Clé admin manquante pour routes admin
- **SUSPICIOUS_TOKEN** - Token JWT suspect (trop court)
- **LARGE_PAYLOAD** - Payload trop volumineux (>1MB)
- **SUSPICIOUS_IP_ACCESS** - Accès depuis IP suspecte
- **SUCCESSFUL_LOGIN** - Connexion réussie
- **USER_LOGOUT** - Déconnexion utilisateur
- **PASSWORD_CHANGED** - Changement de mot de passe
- **VALIDATION_ERROR** - Erreur de validation des données

## ⚙️ Configuration

### Variables d'environnement
```env
# Liste d'IPs suspectes (séparées par des virgules)
SUSPICIOUS_IPS=192.168.1.100,10.0.0.5

# Clé admin pour accéder aux logs
ADMIN_KEY=votre-cle-admin-secrete
```

### Nettoyage automatique
- Les logs sont automatiquement nettoyés au démarrage
- Suppression des fichiers de plus de 30 jours
- Conservation des logs récents pour analyse

## 🛠️ Utilisation dans le code

### Logger une erreur
```javascript
const { logger } = require('./models/logger');

try {
  // Code risqué
} catch (error) {
  logger.error('Erreur lors du traitement', { error: error.message, userId });
}
```

### Logger un événement de sécurité
```javascript
const { logSecurityEvent } = require('./middleware/security');

logSecurityEvent('CUSTOM_SECURITY_EVENT', {
  userId: '123',
  action: 'suspicious_activity',
  details: { reason: 'Multiple failed attempts' }
});
```

### Logger une information générale
```javascript
logger.info('Utilisateur créé', { userId: newUser._id, email: newUser.email });
```

## 📈 Monitoring recommandé

1. **Surveiller `error.log`** pour les problèmes critiques
2. **Analyser `security.log`** pour détecter les attaques
3. **Consulter `requests.log`** pour les performances
4. **Utiliser `combined.log`** pour le debugging général

## 🔧 Maintenance

### Rotation des logs
Les logs sont automatiquement nettoyés, mais vous pouvez aussi :
```bash
# Sauvegarder les logs importants
cp logs/security.log logs/security-$(date +%Y%m%d).log

# Vider un log spécifique
> logs/debug.log
```

### Analyse des logs
```bash
# Compter les erreurs par jour
grep '"level":"ERROR"' logs/error.log | grep '"timestamp":"2024-01-' | wc -l

# Trouver les IPs les plus actives
grep '"ip":' logs/requests.log | sed 's/.*"ip":"\([^"]*\)".*/\1/' | sort | uniq -c | sort -nr | head -10
```
pour tester faut faire "npm node puis le nom du ficher" 
---
