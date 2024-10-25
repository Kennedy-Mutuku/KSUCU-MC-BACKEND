const mongoose = require('mongoose');

const bsAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true, },
});

module.exports = mongoose.model('BibleStudyAdmin', bsAdminSchema);

