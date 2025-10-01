const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['feedback', 'suggestion', 'complaint', 'praise', 'prayer', 'technical', 'other'],
        default: 'feedback'
    },
    isAnonymous: {
        type: Boolean,
        required: true,
        default: true
    },
    senderInfo: {
        username: { type: String },
        email: { type: String },
        ministry: { type: String },
        yos: { type: Number }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    }
});

module.exports = mongoose.model('messages', MessageSchema);
