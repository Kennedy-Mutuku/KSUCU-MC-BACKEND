const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['mobile_money', 'bank', 'other']
  },
  details: [{
    label: { 
      type: String, 
      required: true,
      trim: true
    },
    value: { 
      type: String, 
      required: true,
      trim: true
    }
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

const contactInfoSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['phone', 'email', 'office']
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  value: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  priority: { 
    type: Number, 
    default: 0 
  }
});

const compassionSettingsSchema = new mongoose.Schema({
  paymentMethods: [paymentMethodSchema],
  contactInfo: [contactInfoSchema],
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  updatedBy: { 
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure there's always one settings document
compassionSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings
    settings = await this.create({
      paymentMethods: [
        {
          name: 'M-Pesa',
          type: 'mobile_money',
          details: [
            { label: 'Paybill', value: '522522' },
            { label: 'Account', value: 'KSUCU-COMPASSION' }
          ],
          isActive: true
        },
        {
          name: 'Bank Transfer',
          type: 'bank',
          details: [
            { label: 'Bank', value: 'Equity Bank' },
            { label: 'Account', value: '0460291234567' },
            { label: 'Name', value: 'KSUCU-MC Compassion Ministry' }
          ],
          isActive: true
        }
      ],
      contactInfo: [
        {
          type: 'phone',
          title: 'Emergency Hotline',
          value: '+254 700 123 456',
          description: 'Available 24/7 for urgent cases',
          isActive: true,
          priority: 1
        },
        {
          type: 'email',
          title: 'Email Support',
          value: 'compassion@ksucu.ac.ke',
          description: 'Response within 24 hours',
          isActive: true,
          priority: 2
        }
      ]
    });
  }
  return settings;
};

module.exports = mongoose.model('CompassionSettings', compassionSettingsSchema);