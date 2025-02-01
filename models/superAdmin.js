const mongoose = require('mongoose');

const superAdmin = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true, },
});

module.exports = mongoose.model('SuperAdmin', superAdmin);

