const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // New fields for professional document management
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentCategory',
    default: null
  },
  categoryName: {
    type: String,
    default: 'Uncategorized'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'expired'],
    default: 'active'
  },
  expiryDate: {
    type: Date,
    default: null
  },
  uploadedByAdmin: {
    type: Boolean,
    default: false
  },
  downloadedAt: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
