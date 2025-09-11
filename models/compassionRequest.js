const mongoose = require('mongoose');

const compassionRequestSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  phone: { 
    type: String, 
    required: true,
    trim: true
  },
  location: { 
    type: String, 
    required: true,
    trim: true
  },
  helpType: { 
    type: String, 
    required: true,
    enum: ['material', 'financial', 'counseling', 'spiritual', 'medical', 'other']
  },
  urgency: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high', 'emergency']
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  preferredContact: { 
    type: String, 
    required: true,
    enum: ['phone', 'whatsapp', 'email', 'visit']
  },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'in_progress', 'resolved', 'declined']
  },
  assignedTo: { 
    type: String,
    trim: true
  },
  notes: { 
    type: String,
    trim: true
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for better performance
compassionRequestSchema.index({ status: 1, urgency: 1, submittedAt: -1 });
compassionRequestSchema.index({ email: 1 });
compassionRequestSchema.index({ phone: 1 });

module.exports = mongoose.model('CompassionRequest', compassionRequestSchema);