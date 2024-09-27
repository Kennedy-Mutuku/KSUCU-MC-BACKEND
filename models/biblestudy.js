const mongoose = require('mongoose');

const biblestudySchema = new mongoose.Schema({
    name: { type: String, required: true },
    residence: { type: String, required: true }, 
    yos: { type: String, required: true },
    phone: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('bs', biblestudySchema);

