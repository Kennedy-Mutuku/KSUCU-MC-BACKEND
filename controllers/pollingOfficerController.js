const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PollingOfficer = require('../models/pollingOfficer');
const User = require('../models/user');
const PollingStats = require('../models/pollingStats');

// Create polling officer (Super Admin only)
exports.createOfficer = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingOfficer = await PollingOfficer.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingOfficer) {
            return res.status(400).json({ message: 'Email or phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newOfficer = new PollingOfficer({
            fullName,
            email,
            phone,
            password: hashedPassword,
            createdBy: req.userId, // From super admin middleware
            status: 'active'
        });

        await newOfficer.save();

        res.status(201).json({
            message: 'Polling officer created successfully',
            officer: {
                id: newOfficer._id,
                fullName: newOfficer.fullName,
                email: newOfficer.email,
                phone: newOfficer.phone,
                status: newOfficer.status
            }
        });
    } catch (error) {
        console.error('Error creating polling officer:', error);
        res.status(500).json({ message: 'Error creating polling officer', error: error.message });
    }
};

// Polling officer login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Polling Officer Login attempt - Email:', email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const officer = await PollingOfficer.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        if (!officer) {
            console.log('Polling officer not found with email:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (officer.status === 'suspended') {
            return res.status(403).json({ message: 'Your account has been suspended' });
        }

        if (officer.status === 'deleted') {
            return res.status(403).json({ message: 'Your account has been deleted' });
        }

        console.log('Polling officer found, checking password...');
        const isPasswordValid = await bcrypt.compare(password, officer.password);

        if (!isPasswordValid) {
            console.log('Invalid password for polling officer:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('Polling officer login successful for:', email);

        // Update last login
        officer.lastLogin = new Date();
        await officer.save();

        const token = jwt.sign(
            { userId: officer._id, role: 'polling_officer' },
            process.env.JWT_ADMIN_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('polling_officer_token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            sameSite: 'None',
        });

        res.status(200).json({
            message: 'Login successful',
            officer: {
                id: officer._id,
                fullName: officer.fullName,
                email: officer.email
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Polling officer logout
exports.logout = (req, res) => {
    res.clearCookie('polling_officer_token', { httpOnly: true, secure: true, sameSite: 'None' });
    res.status(200).json({ message: 'Logout successful' });
};

// Get current polling officer profile
exports.getProfile = async (req, res) => {
    try {
        const officer = await PollingOfficer.findById(req.userId).select('-password');

        if (!officer) {
            return res.status(404).json({ message: 'Polling officer not found' });
        }

        res.status(200).json({
            id: officer._id,
            fullName: officer.fullName,
            email: officer.email,
            status: officer.status
        });
    } catch (error) {
        console.error('Error fetching officer profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

// Get all polling officers (Super Admin only)
exports.getAllOfficers = async (req, res) => {
    try {
        const officers = await PollingOfficer.find({ status: { $ne: 'deleted' } })
            .select('-password')
            .populate('createdBy', 'email')
            .sort({ createdAt: -1 });

        // Get count of users registered by each officer
        const officersWithStats = await Promise.all(officers.map(async (officer) => {
            const registeredCount = await User.countDocuments({ registeredBy: officer._id });
            const votedCount = await User.countDocuments({ votedBy: officer._id });

            return {
                ...officer.toObject(),
                registeredCount,
                votedCount
            };
        }));

        res.status(200).json(officersWithStats);
    } catch (error) {
        console.error('Error fetching polling officers:', error);
        res.status(500).json({ message: 'Error fetching polling officers', error: error.message });
    }
};

// Update officer status (Super Admin only)
exports.updateOfficerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended', 'deleted'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const officer = await PollingOfficer.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).select('-password');

        if (!officer) {
            return res.status(404).json({ message: 'Polling officer not found' });
        }

        res.status(200).json({
            message: 'Officer status updated successfully',
            officer
        });
    } catch (error) {
        console.error('Error updating officer status:', error);
        res.status(500).json({ message: 'Error updating officer status', error: error.message });
    }
};

// Search for user
exports.searchUser = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Search query required' });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { reg: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('-password').limit(10);

        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};

// Register new user and mark as voted
exports.registerAndVoteUser = async (req, res) => {
    try {
        const { username, email, phone, reg, course, yos, ministry, et } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone: phone || undefined }, { reg: reg || undefined }].filter(Boolean)
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email, phone, or registration number' });
        }

        const newUser = new User({
            username,
            email,
            phone: phone || '',
            reg: reg || '',
            course: course || '',
            yos: yos || '',
            ministry: ministry || '',
            et: et || '',
            hasVoted: true,
            votedAt: new Date(),
            votedBy: req.userId,
            registeredBy: req.userId
        });

        await newUser.save();

        // Update stats
        await updatePollingStats();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('userVoted', { userId: newUser._id });
            io.emit('newUserRegistered', { user: newUser });
            const stats = await getStats();
            io.emit('statsUpdate', stats);
        }

        res.status(201).json({
            message: 'User registered and marked as voted successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Error registering and voting user:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Mark existing user as voted
exports.markAsVoted = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.hasVoted) {
            return res.status(400).json({ message: 'User has already voted' });
        }

        user.hasVoted = true;
        user.votedAt = new Date();
        user.votedBy = req.userId;
        await user.save();

        // Update stats
        await updatePollingStats();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('userVoted', { userId: user._id });
            const stats = await getStats();
            io.emit('statsUpdate', stats);
        }

        res.status(200).json({
            message: 'User marked as voted successfully',
            user
        });
    } catch (error) {
        console.error('Error marking user as voted:', error);
        res.status(500).json({ message: 'Error marking user as voted', error: error.message });
    }
};

// Get unvoted users
exports.getUnvotedUsers = async (req, res) => {
    try {
        const users = await User.find({ hasVoted: false })
            .select('-password')
            .sort({ username: 1 });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching unvoted users:', error);
        res.status(500).json({ message: 'Error fetching unvoted users', error: error.message });
    }
};

// Get all voted users (Super Admin only)
exports.getAllVotedUsers = async (req, res) => {
    try {
        const users = await User.find({ hasVoted: true })
            .select('-password')
            .populate('votedBy', 'fullName email')
            .populate('registeredBy', 'fullName email')
            .sort({ votedAt: -1 });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching voted users:', error);
        res.status(500).json({ message: 'Error fetching voted users', error: error.message });
    }
};

// Get polling statistics
exports.getPollingStats = async (req, res) => {
    try {
        const stats = await getStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching polling stats:', error);
        res.status(500).json({ message: 'Error fetching polling stats', error: error.message });
    }
};

// Helper function to update polling stats
async function updatePollingStats() {
    try {
        const totalUsers = await User.countDocuments();
        const totalVoted = await User.countDocuments({ hasVoted: true });
        const totalNotVoted = await User.countDocuments({ hasVoted: false });

        await PollingStats.findOneAndUpdate(
            {},
            {
                totalUsers,
                totalVoted,
                totalNotVoted,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error updating polling stats:', error);
    }
}

// Helper function to get stats
async function getStats() {
    try {
        const totalUsers = await User.countDocuments();
        const totalVoted = await User.countDocuments({ hasVoted: true });
        const totalNotVoted = await User.countDocuments({ hasVoted: false });
        const percentageVoted = totalUsers > 0 ? ((totalVoted / totalUsers) * 100).toFixed(2) : 0;

        return {
            totalUsers,
            totalVoted,
            totalNotVoted,
            percentageVoted,
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return {
            totalUsers: 0,
            totalVoted: 0,
            totalNotVoted: 0,
            percentageVoted: 0,
            lastUpdated: new Date()
        };
    }
}
