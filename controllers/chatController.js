const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/chatMessage');
const OnlineUsers = require('../models/onlineUsers');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
      'application/pdf', 'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
}).single('media');

// Get recent messages
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({ deleted: false })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('replyTo', 'message senderName timestamp')
      .lean();

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { message, messageType = 'text', replyTo } = req.body;
    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newMessage = new ChatMessage({
      senderId: userId,
      senderName: user.username,
      message: message || '',
      messageType,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    // Populate replyTo field for response
    await newMessage.populate('replyTo', 'message senderName timestamp');

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Upload media
exports.uploadMedia = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const userId = req.user.userId;
      const { message: textMessage, replyTo } = req.body;

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Determine message type based on file mimetype
      let messageType = 'file';
      if (req.file.mimetype.startsWith('image/')) messageType = 'image';
      else if (req.file.mimetype.startsWith('video/')) messageType = 'video';
      else if (req.file.mimetype.startsWith('audio/')) messageType = 'audio';

      const mediaUrl = `/uploads/chat/${req.file.filename}`;

      const newMessage = new ChatMessage({
        senderId: userId,
        senderName: user.username,
        message: textMessage || '',
        messageType,
        mediaUrl,
        mediaFileName: req.file.originalname,
        mediaSize: req.file.size,
        replyTo: replyTo || null,
      });

      await newMessage.save();

      // Populate replyTo field for response
      await newMessage.populate('replyTo', 'message senderName timestamp');

      res.json({ success: true, message: newMessage });
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ success: false, message: 'Failed to upload media' });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    const chatMessage = await ChatMessage.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (chatMessage.senderId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    chatMessage.message = message;
    chatMessage.edited = true;
    chatMessage.editedAt = new Date();
    await chatMessage.save();

    await chatMessage.populate('replyTo', 'message senderName timestamp');

    res.json({ success: true, message: chatMessage });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const chatMessage = await ChatMessage.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (chatMessage.senderId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    chatMessage.deleted = true;
    await chatMessage.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

// Get online users
exports.getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await OnlineUsers.find({ status: 'online' })
      .populate('userId', 'username email')
      .select('username status lastSeen')
      .lean();

    res.json({ success: true, users: onlineUsers });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch online users' });
  }
};