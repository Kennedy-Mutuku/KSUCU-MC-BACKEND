
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: false,  // Optional for authentication users, required for uploaded content
    },
    body: {
        type: String,
        required: false,  // Optional for authentication users, required for uploaded content
    },
    imageUrl: {
        type: String,
        required: false,  // Optional for authentication users, required for uploaded content
    },
    eventDate: {
        type: Date,
        required: false,  // Optional - only for events with countdown
    },
    eventTime: {
        type: String,
        required: false,  // Optional - time for the event (e.g., "14:30")
    },
});

const User = mongoose.model('adminNews', userSchema);

module.exports = User;

