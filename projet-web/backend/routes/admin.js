const express = require('express');
const router = express.Router();
const { adminKeyMiddleware } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/users', adminKeyMiddleware, adminController.getAllUsers);
router.get('/users/:userId', adminKeyMiddleware, adminController.getUserById);
router.put('/users/:userId/deactivate', adminKeyMiddleware, adminController.deactivateUser);
router.put('/users/:userId/activate', adminKeyMiddleware, adminController.activateUser);
router.delete('/users/:userId', adminKeyMiddleware, adminController.deleteUser);
router.get('/stats', adminKeyMiddleware, adminController.getSystemStats);
router.get('/users/:userId/activity', adminKeyMiddleware, adminController.getUserActivity);
router.get('/users/:userId/export', adminKeyMiddleware, adminController.exportUserData);

module.exports = router;
