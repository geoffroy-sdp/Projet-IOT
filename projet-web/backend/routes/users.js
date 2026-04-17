const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Auth routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// User profile routes
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);
router.put('/location', authMiddleware, userController.updateUserLocation);
router.put('/carplay-info', authMiddleware, userController.updateCarPlayInfo);
router.put('/change-password', authMiddleware, userController.changePassword);
router.delete('/account', authMiddleware, userController.deleteUserAccount);

// GPS routes
router.post('/gps', authMiddleware, userController.addGpsData);
router.get('/gps', authMiddleware, userController.getUserGpsData);
router.get('/gps/:gpsId', authMiddleware, userController.getGpsById);
router.put('/gps/:gpsId', authMiddleware, userController.updateGpsData);
router.delete('/gps/:gpsId', authMiddleware, userController.deleteGpsData);

// Session routes
router.post('/sessions', authMiddleware, userController.createSession);
router.get('/sessions', authMiddleware, userController.getUserSessions);
router.get('/sessions/:sessionId', authMiddleware, userController.getSessionById);
router.put('/sessions/:sessionId', authMiddleware, userController.updateSession);
router.delete('/sessions/:sessionId', authMiddleware, userController.deleteSession);

// Metadata routes
router.get('/metadata', authMiddleware, userController.getUserMetadata);
router.put('/metadata', authMiddleware, userController.updateMetadata);


// Music routes (alternative endpoints)
router.get('/music/last', authMiddleware, userController.getLastMusic);
router.put('/music/last', authMiddleware, userController.updateLastMusic);

// Complete user data export
router.get('/data/export', authMiddleware, userController.exportAllUserData);

module.exports = router;
