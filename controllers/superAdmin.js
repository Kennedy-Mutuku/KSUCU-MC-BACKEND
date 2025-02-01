const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Users = require('../models/user'); 
const sAdmin = require('../models/superAdmin');
const Feedback = require('../models/feedbackSchema');

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
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await sAdmin.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_USER_SECRET, { expiresIn: '1h' });

        res.cookie('bs_token', token, {
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
    res.clearCookie('bs_token', { httpOnly: true, secure: true, sameSite: 'None' });
    res.status(200).json({ message: 'Logout successful' });
};

// Get all users for frontend
exports.getUsers = async (req, res) => {
    try {
        const users = await Users.find({}, '-_id name yos'); // Fetch only necessary fields
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

// Get all feedback for frontend
exports.getFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({}, '-_id anonymous name message');
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback', error });
    }
};

