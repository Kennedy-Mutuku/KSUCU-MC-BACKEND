const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Soul = require('../models/savedSouls')
const bs = require('../models/biblestudy')
const { sendMail, generateToken } = require('../helperModules/sendmail');

exports.signup = async (req, res) => {
  try {
    const { username, password, email, yos, et, phone, ministry, reg } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { phone }, { reg }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email/Phone/REG already exists' });
    }

    if (!username || !password || !email || !phone  || !et || !yos || !reg || !ministry) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log(
      username,
      password,
      phone,
      ministry,
      reg,
      et,
      yos,
      email
    );

    const token = generateToken({ username, password, email, phone, et, yos, reg, ministry });
    const verificationLink = `https://ksucu-mc-backend.onrender.com/users/verify-email?token=${token}`;

    const subject = 'Email Verification';
    const html = `<p>Please verify your email by clicking on the following link, it expires in five minutes: <a href="${verificationLink}">Verify Email</a></p>`;

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
    const soulCount = await Soul.countDocuments();  // For MongoDB with Mongoose
    res.json({ count: soulCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user count' });
  }
}

exports.bibleStudy = async (req,res) => {
  const { name, residence, yos, phone } = req.body;

  const existingUser = await bs.findOne({phone});
  if (existingUser) {
    return res.status(400).json({ message: 'Email or phone already exists' });
  }

  try {
    const newBs = new bs({ name, residence, yos, phone });
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
    let { username, password, email, phone, et, yos, reg, ministry } = decoded;

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
      ministry
    });

    await newUser.save();

    const user = await User.findOne({ email });
    token = jwt.sign({ userId: user._id }, process.env.JWT_USER_SECRET, { expiresIn: '5m' });

    res.cookie('user_s', token, {
      httpOnly: true,
      secure: false, // Set to true in production
      maxAge: 3 * 60 * 60 * 1000, // 3 hours (match session maxAge)
      sameSite: 'strict', // Enhances security by preventing CSRF attacks
    });

    res.redirect(`https://ksucu-mc-frontend.vercel.app/`);

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
      secure: false, // Set to true in production
      maxAge: 3 * 60 * 60 * 1000, // 3 hours (match session maxAge)
      sameSite: 'strict', // Enhances security by preventing CSRF attacks
    });

    // Sending a success response
     res.status(200).json({ message: 'Login successful' });
    
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

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
      phone: user.phone
    };
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};



