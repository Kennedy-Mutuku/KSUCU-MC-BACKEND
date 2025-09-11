const mongoose = require('mongoose');

const compassionDonationSchema = new mongoose.Schema({
  donorName: { 
    type: String, 
    trim: true
  },
  email: { 
    type: String, 
    trim: true,
    lowercase: true
  },
  phone: { 
    type: String, 
    trim: true
  },
  amount: { 
    type: String,
    trim: true
  },
  donationType: { 
    type: String, 
    required: true,
    enum: ['monetary', 'food', 'clothing', 'medical', 'other']
  },
  message: { 
    type: String,
    trim: true
  },
  anonymous: { 
    type: Boolean, 
    default: false 
  },
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'confirmed', 'received']
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

// Validate that non-anonymous donations have required fields
compassionDonationSchema.pre('save', function(next) {
  if (!this.anonymous) {
    if (!this.donorName || !this.email || !this.phone) {
      const error = new Error('Non-anonymous donations must include donor name, email, and phone');
      return next(error);
    }
  }
  next();
});

// Index for better performance
compassionDonationSchema.index({ status: 1, submittedAt: -1 });
compassionDonationSchema.index({ donationType: 1 });
compassionDonationSchema.index({ anonymous: 1 });

module.exports = mongoose.model('CompassionDonation', compassionDonationSchema);