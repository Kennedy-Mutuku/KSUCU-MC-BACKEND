const Commitment = require("../models/commitment");
const User = require("../models/user");
const commitment = require("../models/commitment");

exports.submitCommitment = async (req, res) => {
  try {
    
    const userId = req.userId;
    const { reasonForJoining, date, signature, croppedImage, ministryLeader, dateApproved } = req.body;

    // Validate required fields
    if (!userId || !reasonForJoining || !date || !signature || !croppedImage) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Find user details from User model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Automatically fill details from User model
    const newCommitment = new Commitment({
      userId,
      fullName: user.username, // Extracted from User model
      phoneNumber: user.phone, // Extracted from User model
      ministry: user.ministry, // Extracted from User model
      reasonForJoining,
      date,
      signature,
      croppedImage,
      dateApproved : date
    });

    await newCommitment.save();
    res.status(200).json({ message: "Commitment form submitted successfully." });

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
      console.log({
        username: user.username,
        phone: user.phone,
        ministry: user.ministry,
        
      });
      

      if(commitment){

        // Send user details
        res.status(200).json({
          username: user.username,
          phone: user.phone,
          ministry: user.ministry,
          reasonForJoining: commitment.reasonForJoining,
          date: commitment.date,
          signature: commitment.signature,
          croppedImage: commitment.croppedImage,
          ministryLeader: commitment.ministryLeader,
          dateApproved: commitment.dateApproved
        })

      }else{
        res.status(200).json({
          username: user.username,
          phone: user.phone,
          ministry: user.ministry,
        })
      }
  
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};



