const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Soul = require('../models/savedSouls')
const bs = require('../models/biblestudy')
const FeedBack = require('../models/feedbackSchema')
const news = require('../models/adminNews')
const { sendMail, generateToken } = require('../helperModules/sendmail');
const backendURL = 'https://ksucu-mc.co.ke'


exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    
    // Enhanced logging for debugging device-specific issues
    console.log('🔐 LOGIN ATTEMPT:', {
      email: email?.toLowerCase(),
      passwordProvided: !!password,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      ip: req.ip || req.connection.remoteAddress,
      referer: req.headers.referer,
      timestamp: new Date().toISOString()
    });
    
    email = email.toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('invalid username');
      
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('invalid pswd');
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_USER_SECRET, { expiresIn: '30d' }); // 30 days expiry

    // Enhanced cookie settings for better cross-device compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      // Add domain if in production for better cookie sharing
      ...(process.env.NODE_ENV === 'production' && { domain: '.ksucu-mc.co.ke' })
    };
    
    console.log('🍪 Setting cookie with options:', cookieOptions);
    console.log('🍪 User agent:', req.headers['user-agent']);
    console.log('🍪 Origin:', req.headers.origin);
    
    res.cookie('user_s', token, cookieOptions);

    // Sending a success response
     res.status(200).json({ message: 'Login successful' });
    
  } catch (error) {
    console.log('Login error:', error);
    
    // Ensure we send a string message, not an error object
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ 
      message: errorMessage,
      error: errorMessage 
    });
  }
  
}

exports.saveSoul = async (req,res) => {
  const { name, phone, region, village } = req.body;

  const existingUser = await Soul.findOne({phone});
  if (existingUser) {
    return res.status(400).json({ message: 'Email or phone already exists' });
  }

  try {
    const newPost = new Soul({ name, phone, region, village });
    await newPost.save();
    res.json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error saving soul");
  }

}

exports.countSaved = async (req,res) => {
  try {
    const soulCount = await Soul.countDocuments(); 
    res.json({ count: soulCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user count' });
  }
}

exports.bibleStudy = async (req,res) => {
  const { name, residence, yos, phone, gender } = req.body;

  const existingUser = await bs.findOne({phone});
  if (existingUser) {
    return res.status(400).json({ message: 'Email or phone already exists' });
  }

  try {
    const newBs = new bs({ name, residence, yos, phone, gender });
    await newBs.save();
    res.status(200).send('Successfully saved');
  } catch (err) {
    console.log(err);
    res.status(500).send("Error saving soul");
  }
}


exports.forgetPassword = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const token = generateToken({ email });

    const resetLink = `${backendURL}/reset?token=${token}`;

    const subject = 'Password Reset';

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; background-color: #fff; padding: 20px; border: 1px solid #730051; border-radius: 8px; max-width: 600px; margin: auto;">
        <h1 style="color: #00c6ff; text-align: center;">Kisii University Christian Union</h1>
        <h2 style="color: #730051; text-align: center; margin-top: -10px;">Main Campus</h2>
        <p style="font-size: 16px;">We received a request to reset your password. If this was you, click the button below to proceed. The link will expire in <span style="color: #730051; font-weight: bold;">1 hour</span>.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #fff; background-color: #730051; text-decoration: none; border-radius: 5px;">
             Reset Password
          </a>
        </div>
        <p style="font-size: 14px;">If you didn’t request a password reset, you can safely ignore this email.</p>
        <p style="color: #730051; font-size: 14px; text-align: center; margin-top: 20px;">Thank you,<br><strong>The Kisii University Christian Union Dev Team</strong></p>
      </div>
    `;
    
    await sendMail(email, subject, html);
       

    res.status(200).json({ message: 'Password reset email sent successfully!' });

  } catch (error) {
    res.status(500).json({ message: error });
  }

};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
    
    const userEmail = decoded.email;

    if (!userEmail) {
      return res.status(400).json({ message: 'Email not found in token payload' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.updateOne({ email: userEmail }, { password: hashedPassword });

    res.status(200).json({ message: 'Password reset successfully!' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }

};

exports.getUserData = async (req, res) => {
  try {
    const userId = req.userId; // Extract user ID from authentication middleware
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Only return necessary user data, you can customize this response as needed

    const userData = {
      username: user.username,
      email: user.email,
      yos: user.yos,
      ministry : user.ministry,
      reg : user.reg,
      et : user.et,
      course: user.course,
      phone: user.phone
    };
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

exports.updateUserData = async (req, res) => {
  try {
    const userId = req.userId; // Extract user ID from authentication middleware

    // Extract updated user details from request body
    const { username, email, yos, ministry, reg, et, course, phone, password } = req.body;

    // Prepare update data
    const updateData = { username, email, yos, ministry, reg, et, course, phone };

    // If password is provided, hash it and include in update
    if (password && password.trim() !== '') {
      console.log('Updating password for user:', userId);
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Find the user by ID and update with the new details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = password && password.trim() !== '' 
      ? 'User details and password updated successfully' 
      : 'User details updated successfully';
    
    res.status(200).json({ message });
  } catch (error) {
    console.log('Error updating user:', error);
    res.status(500).json({ message: error });
  }
};

exports.logout = async (req, res) => {
  try {
    // Clear both cookies with proper options
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/'
    }); 
    
    res.clearCookie('user_s', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/'
    }); 
    
    console.log('User logged out successfully');
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ message: 'An error occurred while processing your request' });
  }
};

exports.feedback = async (req, res) => {
  try {

      const userId = req.userId; 
      
      const user = await User.findById(userId);

      let { anonymous, name, message } = req.body;

      if (!anonymous){
        name = user.username;
      }

      const feedback = new FeedBack({ anonymous, name, message });
      await feedback.save();
      
      res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.log(error);
    
      res.status(500).json({ error: 'Server error' });
  }
  
};
