const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Users = require('../models/user');
const sAdmin = require('../models/superAdmin');
const Feedback = require('../models/feedbackSchema');
const Message = require('../models/message');
const PollingStats = require('../models/pollingStats');

// User signup
exports.signup = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        if (!email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await sAdmin.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email/Phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new sAdmin({ email, phone, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

// User login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Super Admin Login attempt - Email:', email);
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await sAdmin.findOne({ email });
        if (!user) {
            console.log('Super Admin not found with email:', email);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        console.log('Super Admin found, checking password...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password for super admin:', email);
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        console.log('Super Admin login successful for:', email);
        console.log('🔐 Creating token with JWT_ADMIN_SECRET:', process.env.JWT_ADMIN_SECRET ? `${process.env.JWT_ADMIN_SECRET.substring(0, 5)}...` : 'missing');

        const token = jwt.sign({ userId: user._id }, process.env.JWT_ADMIN_SECRET, { expiresIn: '1h' });

        res.cookie('sadmin_token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 1 * 60 * 60 * 1000,
            sameSite: 'None',
        });

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// User logout
exports.logout = (req, res) => {
    res.clearCookie('sadmin_token', { httpOnly: true, secure: true, sameSite: 'None' });
    res.status(200).json({ message: 'Logout successful' });
};

exports.getUsers = async (req, res) => {
    try {
        const users = await Users.find({}, { _id: 0, password: 0, googleId: 0 }); 
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

// Get all feedback for frontend (old system)
exports.getFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({}, '-_id anonymous name message');
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback', error });
    }
};

// Get all messages (new system)
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .lean();
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

// Reset polling data for new election
exports.resetPollingData = async (req, res) => {
    try {
        console.log('Super Admin initiated polling reset');

        // Reset all users' voting status
        const updateResult = await Users.updateMany(
            {},
            {
                $set: {
                    hasVoted: false
                },
                $unset: {
                    votedAt: "",
                    votedBy: ""
                }
            }
        );

        // Reset polling stats
        await PollingStats.findOneAndUpdate(
            {},
            {
                totalVoted: 0,
                totalNotVoted: await Users.countDocuments(),
                lastUpdated: new Date()
            },
            { upsert: true }
        );

        console.log(`Polling data reset - ${updateResult.modifiedCount} users affected`);

        res.status(200).json({
            message: 'Polling data reset successfully',
            usersAffected: updateResult.modifiedCount
        });
    } catch (error) {
        console.error('Error resetting polling data:', error);
        res.status(500).json({ message: 'Error resetting polling data', error: error.message });
    }
};


