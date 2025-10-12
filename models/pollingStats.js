const mongoose = require('mongoose');

const pollingStatsSchema = new mongoose.Schema({
  totalUsers: { type: Number, default: 0 },
  totalVoted: { type: Number, default: 0 },
  totalNotVoted: { type: Number, default: 0 },
  votingActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PollingStats', pollingStatsSchema);
