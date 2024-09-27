const mongoose = require("mongoose");

const soulsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  region: {
    type: String,
    required: true,
  },
  village: { 
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
});

module.exports = mongoose.model("Souls", soulsSchema);


