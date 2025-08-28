const express = require("express");
const { 
  submitCommitment, 
  getUserDetails, 
  getMinistryCommitments, 
  approveCommitment, 
  revokeCommitment 
} = require("../controllers/commitmentController");
const authMiddleware = require("../middlewares/userAuthMiddleware");

const router = express.Router();

// User routes
router.post("/submit-commitment", authMiddleware, submitCommitment);
router.get("/user-details", authMiddleware, getUserDetails); 

// Admin routes
router.get("/ministry/:ministry", authMiddleware, getMinistryCommitments);
router.put("/approve/:commitmentId", authMiddleware, approveCommitment);
router.put("/revoke/:commitmentId", authMiddleware, revokeCommitment);

module.exports = router;
