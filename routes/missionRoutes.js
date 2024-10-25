const express = require('express');
const router = express.Router();
const missionAdmin = require('../controllers/missionAdminController');
const adminNewsAuthMiddleware = require('../middlewares/adminMissionAuthMiddleware');

// Authentication routes
router.post('/signup', missionAdmin.signup);
router.post('/login', missionAdmin.login);

// File upload route (image, title, body)
router.post('/logout', adminNewsAuthMiddleware, missionAdmin.logout);

router.get('/souls', adminNewsAuthMiddleware, missionAdmin.getSoulsSaved);

module.exports = router;


