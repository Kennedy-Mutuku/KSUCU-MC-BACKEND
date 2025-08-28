const Commitment = require("../models/commitment");
const User = require("../models/user");
const commitment = require("../models/commitment");

exports.submitCommitment = async (req, res) => {
  try {
    
    const userId = req.userId;
    const { fullName, phoneNumber, regNo, yearOfStudy, reasonForJoining, date, signature, croppedImage } = req.body;

    // Check if user has already submitted a commitment form
    const existingCommitment = await Commitment.findOne({ userId });
    if (existingCommitment) {
      return res.status(400).json({ message: "You have already submitted a commitment form." });
    }

    // Validate required fields
    if (!userId || !fullName || !phoneNumber || !regNo || !yearOfStudy || !reasonForJoining || !date || !signature) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Find user details from User model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create new commitment with pending status
    const newCommitment = new Commitment({
      userId,
      fullName,
      phoneNumber,
      regNo,
      yearOfStudy,
      ministry: user.ministry, // Extracted from User model
      reasonForJoining,
      date,
      signature,
      croppedImage: croppedImage || null,
      dateApproved: date,
      status: 'pending' // Default to pending approval
    });

    await newCommitment.save();
    res.status(200).json({ message: "Commitment form submitted successfully. Waiting for admin approval." });

  } catch (error) {
    console.error("Error saving commitment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Fetch user details for form auto-population
exports.getUserDetails = async (req, res) => {
    try {
      // Extract user details from middleware
      const userId = req.userId;
      const user = await User.findById(userId);
      const commitment = await Commitment.findOne({ userId })
  
      if (!user) {
        return res.status(401).json({ message: "Unauthorized." });
      }
      
      if(commitment){
        // Send user details with commitment status
        res.status(200).json({
          username: user.username,
          phone: user.phone,
          regNo: user.regNo,
          yearOfStudy: user.yearOfStudy,
          ministry: user.ministry,
          reasonForJoining: commitment.reasonForJoining,
          date: commitment.date,
          signature: commitment.signature,
          croppedImage: commitment.croppedImage,
          ministryLeader: commitment.ministryLeader,
          dateApproved: commitment.dateApproved,
          status: commitment.status,
          hasSubmitted: true
        })
      }else{
        res.status(200).json({
          username: user.username,
          phone: user.phone,
          regNo: user.regNo,
          yearOfStudy: user.yearOfStudy,
          ministry: user.ministry,
          hasSubmitted: false
        })
      }
  
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get commitment forms for a specific ministry (Admin only)
exports.getMinistryCommitments = async (req, res) => {
  try {
    const { ministry } = req.params;
    
    const commitments = await Commitment.find({ ministry })
      .populate('userId', 'username email')
      .populate('reviewedBy', 'username')
      .sort({ submittedAt: -1 });

    res.status(200).json({ commitments });

  } catch (error) {
    console.error("Error fetching ministry commitments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Approve commitment form (Admin only)
exports.approveCommitment = async (req, res) => {
  try {
    const { commitmentId } = req.params;
    const adminId = req.userId;

    const commitment = await Commitment.findByIdAndUpdate(
      commitmentId,
      {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!commitment) {
      return res.status(404).json({ message: "Commitment form not found." });
    }

    res.status(200).json({ 
      message: "Commitment form approved successfully.", 
      commitment 
    });

  } catch (error) {
    console.error("Error approving commitment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Revoke commitment form (Admin only)
exports.revokeCommitment = async (req, res) => {
  try {
    const { commitmentId } = req.params;
    const adminId = req.userId;

    const commitment = await Commitment.findByIdAndUpdate(
      commitmentId,
      {
        status: 'revoked',
        reviewedBy: adminId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!commitment) {
      return res.status(404).json({ message: "Commitment form not found." });
    }

    res.status(200).json({ 
      message: "Commitment form revoked.", 
      commitment 
    });

  } catch (error) {
    console.error("Error revoking commitment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



