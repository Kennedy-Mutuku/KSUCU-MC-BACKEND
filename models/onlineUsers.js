const mongoose = require('mongoose');

const onlineUsersSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  socketId: { 
    type: String, 
    required: true 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['online', 'away', 'busy'], 
    default: 'online' 
  }
}, { timestamps: true });

onlineUsersSchema.index({ userId: 1 });
onlineUsersSchema.index({ socketId: 1 });

module.exports = mongoose.model('OnlineUsers', onlineUsersSchema);