const express = require("express");
const { submitCommitment, getUserDetails } = require("../controllers/commitmentController");
const authMiddleware = require("../middlewares/userAuthMiddleware");

const router = express.Router();

router.post("/submit-commitment", authMiddleware, submitCommitment);
router.get("/user-details", authMiddleware, getUserDetails); 

module.exports = router;
