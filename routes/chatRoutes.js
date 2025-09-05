const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middlewares/authentication');

// Get messages (allow guest access)
router.get('/messages', chatController.getMessages);

// Get online users (allow guest access)  
router.get('/online-users', chatController.getOnlineUsers);

// All other chat routes require authentication
router.use(authenticateToken);

// Send text message
router.post('/send', chatController.sendMessage);

// Upload media message
router.post('/upload', chatController.uploadMedia);

// Edit message
router.put('/edit/:messageId', chatController.editMessage);

// Delete message
router.delete('/delete/:messageId', chatController.deleteMessage);

// Delete message for specific user (allow guest access for demo purposes)
router.delete('/delete-for-me/:messageId', chatController.deleteMessageForMe);

// Update message status
router.put('/status/:messageId', chatController.updateMessageStatus);

module.exports = router;