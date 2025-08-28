const mongoose = require("mongoose");

const CommitmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User model
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  regNo: { type: String, required: true }, // Registration number
  yearOfStudy: { type: String, required: true }, // Year of study
  ministry: { type: String, required: true }, // Add ministry field
  reasonForJoining: { type: String, required: true },
  date: { type: String, required: true },
  signature: { type: String, required: true }, // Base64 string
  croppedImage: { type: String, required: false }, // Base64 or URL (optional)
  ministryLeader: { type: String, default: "Frank Waema" },
  dateApproved: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'revoked'], 
    default: 'pending' 
  }, // Approval status
  submittedAt: { type: Date, default: Date.now }, // When form was submitted
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who reviewed
  reviewedAt: { type: Date } // When reviewed
}, { timestamps: true });

module.exports = mongoose.model("Commitment", CommitmentSchema);
