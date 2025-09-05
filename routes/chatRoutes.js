const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middlewares/authentication');

// All chat routes require authentication
router.use(authenticateToken);

// Get messages
router.get('/messages', chatController.getMessages);

// Send text message
router.post('/send', chatController.sendMessage);

// Upload media message
router.post('/upload', chatController.uploadMedia);

// Edit message
router.put('/edit/:messageId', chatController.editMessage);

// Delete message
router.delete('/delete/:messageId', chatController.deleteMessage);

// Get online users
router.get('/online-users', chatController.getOnlineUsers);

module.exports = router;