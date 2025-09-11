const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Get all settings
router.get('/settings', settingsController.getAllSettings);

// Get single setting
router.get('/settings/:key', settingsController.getSetting);

// Update or create setting
router.put('/settings/:key', settingsController.updateSetting);

// Delete setting
router.delete('/settings/:key', settingsController.deleteSetting);

module.exports = router;