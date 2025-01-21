const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Soul = require('../models/savedSouls')
const bs = require('../models/biblestudy')
const news = require('../models/adminNews')
const { sendMail, generateToken } = require('../helperModules/sendmail');
const backendURL = 'https://ksucu-mc.co.ke'

exports.signup = async (req, res) => {
  try {
    const { username, password, email, yos, et, phone, ministry, course, reg } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { phone }, { reg }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email/Phone/REG already exists' });
    }

    if (!username || !password || !email || !phone  || !et || !yos || !reg || !ministry || !course) {
      return res.status(401).json({ message: 'All fields are required' });
    }

    console.log(
      username,
      password,
      phone,
      ministry,
      reg,
      et,
      yos,
      email,
      course
    );

    const token = generateToken({ username, password, email, phone, et, yos, reg, ministry, course });
    const verificationLink = `${backendURL}/users/verify-email?token=${token}`;

    const subject = 'Verify Your Email Address';

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; background-color: #fff; padding: 20px; border: 1px solid #730051; border-radius: 8px; max-width: 600px; margin: auto;">
        <h1 style="color: #00c6ff; text-align: center;">Kisii University Christian Union</h1>
        <h2 style="color: #730051; text-align: center; margin-top: -10px;">Main Campus</h2>
        <p style="color: #000; font-size: 16px;">We're thrilled to have you join us! To get started, please verify your email address by clicking the button below.</p>
        <p style="color: #000; font-size: 16px;">
          <strong>Important:</strong> This link will expire in <span style="color: #730051; font-weight: bold;">1 hour</span>.
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #fff; background-color: #730051; text-decoration: none; border-radius: 5px;">
             Verify Email
          </a>
        </div>
        <p style="color: #000; font-size: 14px;">If you did not request this email, you can safely ignore it.</p>
        <p style="color: #730051; font-size: 14px; text-align: center; margin-top: 20px;">Thank you,<br><strong>The Kisii University Christian Union Dev Team</strong></p>
      </div>
    `;
    
    await sendMail(email, subject, html);
    
    res.status(201).json({ message: 'Verification email sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: error });
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

exports.verifyEmail = async (req, res) => {
  let { token } = req.query;

  if (!token) {
    return res.status(400).send('Verification token is required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
    let { username, password, email, phone, et, yos, reg, ministry, course } = decoded;

    console.log(course);
    

    email = email.toLowerCase();

    if (!password) {
      throw new Error('Password is missing from the token payload');
    }

    console.log('Decoded token payload:', decoded);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      et,
      phone,
      yos,
      reg,
      course,
      ministry
    });

    await newUser.save();

    const user = await User.findOne({ email });
    token = jwt.sign({ userId: user._id }, process.env.JWT_USER_SECRET, { expiresIn: '5m' });

    res.cookie('user_s', token, {
      httpOnly: true,
      secure: true, // Set to true in production
      maxAge: 3 * 60 * 60 * 1000, // 3 hours (match session maxAge)
      sameSite: 'None', // Required for cross-site cookies
    });

    res.redirect('https://ksucu-mc.co.ke');

  } catch (error) {
    console.error('Error verifying email:', error.message);
    res.status(400).send('Invalid or expired verification token');
  }
}

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    
    email = email.toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_USER_SECRET, { expiresIn: '2h' });

    res.cookie('user_s', token, {
      httpOnly: true,
      secure: true, // Set to true in production
      maxAge: 3 * 60 * 60 * 1000, // 3 hours (match session maxAge)
      sameSite: 'None', // Required for cross-site cookies
    });

    // Sending a success response
     res.status(200).json({ message: 'Login successful' });
    
  } catch (error) {
    res.status(500).json({ message: error });
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

    if(user && user.googleId){
      return res.status(404).json({ message: 'erroo895423456' });
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
    const { username, email, yos, ministry, reg, et, course, phone } = req.body;

    // Find the user by ID and update with the new details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email, yos, ministry, reg, et, course, phone },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User details updated successfully', updatedUser });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('token'); 
    res.clearCookie('user_s'); 
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ message: 'An error occurred while processing your request' });
  }
};

