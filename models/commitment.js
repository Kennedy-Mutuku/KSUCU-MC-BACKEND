const mongoose = require("mongoose");

const CommitmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  ministry: { type: String, required: true }, // Add ministry field
  reasonForJoining: { type: String, required: true },
  date: { type: String, required: true },
  signature: { type: String, required: true }, // Base64 string
  croppedImage: { type: String, required: true }, // Base64 or URL
  ministryLeader: { type: String, default: "Frank Waema" },
  dateApproved: { type: String, required:true }
}, { timestamps: true });

module.exports = mongoose.model("Commitment", CommitmentSchema);
