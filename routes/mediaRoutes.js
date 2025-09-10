const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticateAdmin } = require('../middlewares/adminAuthMiddleware');

router.get('/media-items', mediaController.getAllMediaItems);

router.post('/media-items', authenticateAdmin, mediaController.createMediaItem);

router.put('/media-items/:id', authenticateAdmin, mediaController.updateMediaItem);

router.delete('/media-items/:id', authenticateAdmin, mediaController.deleteMediaItem);

router.post('/media-items/migrate', authenticateAdmin, mediaController.migrateFromLocalStorage);

router.post('/media-items/upload-image', authenticateAdmin, mediaController.uploadImage);

module.exports = router;