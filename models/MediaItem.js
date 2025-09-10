const mongoose = require('mongoose');

const mediaItemSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

mediaItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MediaItem = mongoose.model('MediaItem', mediaItemSchema);

module.exports = MediaItem;