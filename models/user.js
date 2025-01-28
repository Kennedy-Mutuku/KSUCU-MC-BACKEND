const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  reg: { type: String },
  yos: { type: String },
  ministry: { type: String },
  course: { type: String },
  et: { type: String },
  password: { type: String },
  googleId: { type: String },
});

module.exports = mongoose.model('User', userSchema);
