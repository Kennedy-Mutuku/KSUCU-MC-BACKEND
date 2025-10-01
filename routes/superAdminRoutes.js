const express = require('express');
const router = express.Router();
const superAdmin = require('../controllers/superAdmin');
const superAdminMiddleware = require('../middlewares/superAdmin');

// Authentication routes
router.post('/signup', superAdmin.signup);
router.post('/login', superAdmin.login);

router.post('/logout', superAdminMiddleware, superAdmin.logout);

router.get('/users', superAdminMiddleware, superAdmin.getUsers);
router.get('/feedback', superAdminMiddleware, superAdmin.getFeedback);
router.get('/messages', superAdminMiddleware, superAdmin.getMessages);

module.exports = router;

