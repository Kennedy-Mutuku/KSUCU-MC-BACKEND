require('dotenv').config();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken')

//  Nodemailer transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const sendMail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const generateToken = ({ username, password, email, yos, et, phone, ministry,course, reg }) => {
  const payload = { username, password, email, yos, et, phone, ministry,course, reg };
  const secret = process.env.JWT_USER_SECRET;
  const options = { expiresIn: '1h' };
  return jwt.sign(payload, secret, options);
};

module.exports = {sendMail, generateToken};

