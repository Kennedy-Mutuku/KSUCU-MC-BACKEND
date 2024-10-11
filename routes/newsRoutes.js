const express = require('express');
const router = express.Router();
const userController = require('../controllers/newsAdminController');
const adminNewsAuthMiddleware = require('../middlewares/adminNewsAuthMiddleware');


// Authentication routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);

// File upload route (image, title, body)
router.post('/upload',adminNewsAuthMiddleware, userController.uploadFile);

router.get('/news', adminNewsAuthMiddleware, userController.getNewsData);

module.exports = router;

