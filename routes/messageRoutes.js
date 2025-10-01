const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const superAdminMiddleware = require('../middlewares/superAdmin');

// Public route - anyone can submit messages (anonymous or identified)
router.post('/', messageController.submitMessage);

// Protected routes - only super admin can view/manage messages
router.get('/', superAdminMiddleware, messageController.getAllMessages);
router.put('/:id', superAdminMiddleware, messageController.updateMessageStatus);
router.delete('/:id', superAdminMiddleware, messageController.deleteMessage);

module.exports = router;
