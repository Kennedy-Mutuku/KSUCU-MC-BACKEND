const mongoose = require('mongoose');

const biblestudySchema = new mongoose.Schema({
    name: { type: String, required: true },
    residence: { type: String, required: true }, 
    yos: { type: String, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    isPastor: { type: Boolean, default: false }
});

module.exports = mongoose.model('bs', biblestudySchema);

