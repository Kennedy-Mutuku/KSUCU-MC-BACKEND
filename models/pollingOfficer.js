const mongoose = require('mongoose');

const pollingOfficerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true
  },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PollingOfficer', pollingOfficerSchema);
