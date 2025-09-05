const express = require('express');
const router = express.Router();
const bsAdmin = require('../controllers/bsAdminController');
const bsAuthMiddleware = require('../middlewares/bsAuthMiddleware');

// Authentication routes
router.post('/signup', bsAdmin.signup);
router.post('/login', bsAdmin.login);

// File upload route (image, title, body)
router.post('/logout', bsAuthMiddleware, bsAdmin.logout);

router.get('/users', bsAuthMiddleware, bsAdmin.getSoulsSaved);

// Residence management routes
router.get('/residences', bsAdmin.getResidences);
router.post('/residences', bsAuthMiddleware, bsAdmin.addResidence);
router.put('/residences/:id', bsAuthMiddleware, bsAdmin.updateResidence);
router.delete('/residences/:id', bsAuthMiddleware, bsAdmin.deleteResidence);

module.exports = router;

