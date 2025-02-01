const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    anonymous: { type: Boolean, required: true },
    name: { type: String }, // Only required if anonymous is false
    message: { type: String, required: true },
});

module.exports = mongoose.model('feedbacks', FeedbackSchema);
