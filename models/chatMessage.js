const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  senderName: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    default: '' 
  },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'file'], 
    default: 'text' 
  },
  mediaUrl: { 
    type: String, 
    default: null 
  },
  mediaFileName: { 
    type: String, 
    default: null 
  },
  mediaSize: { 
    type: Number, 
    default: null 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  edited: { 
    type: Boolean, 
    default: false 
  },
  editedAt: { 
    type: Date, 
    default: null 
  },
  deleted: { 
    type: Boolean, 
    default: false 
  },
  replyTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatMessage', 
    default: null 
  }
}, { timestamps: true });

chatMessageSchema.index({ timestamp: -1 });
chatMessageSchema.index({ senderId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);