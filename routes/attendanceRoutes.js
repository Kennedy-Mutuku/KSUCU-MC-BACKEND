const express = require('express');
const router = express.Router();
const { AttendanceSession, AttendanceRecord } = require('../models/attendance');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// Start attendance session
router.post('/start-session', async (req, res) => {
    try {
        const { ministry } = req.body;
        
        if (!ministry) {
            return res.status(400).json({ message: 'Ministry is required' });
        }
        
        // Check if there's already an active session for this ministry
        const existingSession = await AttendanceSession.findOne({ 
            ministry, 
            isActive: true 
        });
        
        if (existingSession) {
            return res.status(400).json({ 
                message: 'There is already an active session for this ministry' 
            });
        }
        
        const session = new AttendanceSession({
            ministry,
            isActive: true,
            startTime: new Date()
        });
        
        await session.save();
        
        res.status(201).json({
            message: 'Attendance session started successfully',
            session
        });
        
    } catch (error) {
        console.error('Error starting attendance session:', error);
        res.status(500).json({ 
            message: 'Error starting attendance session',
            error: error.message 
        });
    }
});

// End attendance session
router.post('/end-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }
        
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        session.isActive = false;
        session.endTime = new Date();
        
        await session.save();
        
        res.json({
            message: 'Attendance session ended successfully',
            session
        });
        
    } catch (error) {
        console.error('Error ending attendance session:', error);
        res.status(500).json({ 
            message: 'Error ending attendance session',
            error: error.message 
        });
    }
});

// Get session for ministry
router.get('/session/:ministry', async (req, res) => {
    try {
        const { ministry } = req.params;
        
        // Find the most recent session for this ministry
        const session = await AttendanceSession.findOne({ 
            ministry 
        }).sort({ createdAt: -1 });
        
        if (!session) {
            return res.json({ 
                message: 'No session found for this ministry',
                session: null 
            });
        }
        
        // Check if user has already signed (if authenticated)
        let userSigned = false;
        const token = req.cookies.token;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const existingRecord = await AttendanceRecord.findOne({
                    sessionId: session._id,
                    userId: decoded.id
                });
                userSigned = !!existingRecord;
            } catch (error) {
                // Token invalid, ignore
            }
        }
        
        res.json({
            session,
            userSigned
        });
        
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(500).json({ 
            message: 'Error getting session',
            error: error.message 
        });
    }
});

// Sign attendance
router.post('/sign', verifyToken, async (req, res) => {
    try {
        const { sessionId, ministry } = req.body;
        
        if (!sessionId || !ministry) {
            return res.status(400).json({ 
                message: 'Session ID and ministry are required' 
            });
        }
        
        // Find the session
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        if (!session.isActive) {
            return res.status(400).json({ 
                message: 'This attendance session is closed' 
            });
        }
        
        // Get user details
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user already signed for this session
        const existingRecord = await AttendanceRecord.findOne({
            sessionId,
            userId: req.user.id
        });
        
        if (existingRecord) {
            return res.status(400).json({ 
                message: 'You have already signed attendance for this session' 
            });
        }
        
        // Create attendance record
        const attendanceRecord = new AttendanceRecord({
            sessionId,
            userId: req.user.id,
            userName: user.username,
            regNo: user.regNo || 'N/A',
            year: user.year || 1,
            ministry,
            signedAt: new Date()
        });
        
        await attendanceRecord.save();
        
        // Update session attendance count
        session.attendanceCount += 1;
        await session.save();
        
        res.json({
            message: 'Attendance signed successfully',
            record: attendanceRecord
        });
        
    } catch (error) {
        console.error('Error signing attendance:', error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'You have already signed attendance for this session' 
            });
        }
        res.status(500).json({ 
            message: 'Error signing attendance',
            error: error.message 
        });
    }
});

// Get attendance records for a session
router.get('/records/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const records = await AttendanceRecord.find({ sessionId })
            .populate('userId', 'username email')
            .sort({ signedAt: 1 });
            
        res.json({
            records
        });
        
    } catch (error) {
        console.error('Error getting attendance records:', error);
        res.status(500).json({ 
            message: 'Error getting attendance records',
            error: error.message 
        });
    }
});

// Get all sessions for a ministry
router.get('/sessions/:ministry', async (req, res) => {
    try {
        const { ministry } = req.params;
        
        const sessions = await AttendanceSession.find({ ministry })
            .sort({ createdAt: -1 });
            
        res.json({
            sessions
        });
        
    } catch (error) {
        console.error('Error getting sessions:', error);
        res.status(500).json({ 
            message: 'Error getting sessions',
            error: error.message 
        });
    }
});

// ==== NEW SESSION MANAGEMENT ENDPOINTS FOR CROSS-DEVICE FUNCTIONALITY ====

// Get current active session status (for cross-device checking)
router.get('/session/status', async (req, res) => {
    try {
        // Find any active session (only one can be active at a time)
        const activeSession = await AttendanceSession.findOne({ isActive: true });
        
        if (!activeSession) {
            return res.json({
                message: 'No active session',
                session: null
            });
        }
        
        res.json({
            message: 'Active session found',
            session: {
                _id: activeSession._id,
                leadershipRole: activeSession.leadershipRole,
                ministry: activeSession.ministry,
                isActive: activeSession.isActive,
                startTime: activeSession.startTime,
                attendanceCount: activeSession.attendanceCount
            }
        });
        
    } catch (error) {
        console.error('Error checking session status:', error);
        res.status(500).json({ 
            message: 'Error checking session status',
            error: error.message 
        });
    }
});

// Open new centralized session (admin only)
router.post('/session/open', async (req, res) => {
    try {
        const { leadershipRole, ministry = 'General' } = req.body;
        
        if (!leadershipRole) {
            return res.status(400).json({ message: 'Leadership role is required' });
        }
        
        // Check if there's already an active session (only one allowed at a time)
        const existingSession = await AttendanceSession.findOne({ isActive: true });
        
        if (existingSession) {
            return res.status(409).json({ 
                message: 'Another session is already active',
                activeSession: {
                    leadershipRole: existingSession.leadershipRole,
                    startTime: existingSession.startTime
                }
            });
        }
        
        // Create new session
        const session = new AttendanceSession({
            ministry,
            leadershipRole,
            isActive: true,
            startTime: new Date()
        });
        
        await session.save();
        
        console.log(`✅ Session opened by ${leadershipRole} for ${ministry} ministry`);
        
        res.status(201).json({
            message: 'Session opened successfully',
            session: {
                _id: session._id,
                leadershipRole: session.leadershipRole,
                ministry: session.ministry,
                isActive: session.isActive,
                startTime: session.startTime
            }
        });
        
    } catch (error) {
        console.error('Error opening session:', error);
        res.status(500).json({ 
            message: 'Error opening session',
            error: error.message 
        });
    }
});

// Close active session (admin only)
router.post('/session/close', async (req, res) => {
    try {
        const { leadershipRole, totalAttendees } = req.body;
        
        if (!leadershipRole) {
            return res.status(400).json({ message: 'Leadership role is required' });
        }
        
        // Find the active session for this leader
        const session = await AttendanceSession.findOne({ 
            isActive: true,
            leadershipRole: leadershipRole 
        });
        
        if (!session) {
            return res.status(404).json({ 
                message: 'No active session found for your leadership role' 
            });
        }
        
        // Close the session
        session.isActive = false;
        session.endTime = new Date();
        if (totalAttendees !== undefined) {
            session.attendanceCount = totalAttendees;
        }
        
        await session.save();
        
        console.log(`🔒 Session closed by ${leadershipRole} - ${session.attendanceCount} attendees`);
        
        res.json({
            message: 'Session closed successfully',
            session: {
                _id: session._id,
                leadershipRole: session.leadershipRole,
                ministry: session.ministry,
                isActive: session.isActive,
                startTime: session.startTime,
                endTime: session.endTime,
                attendanceCount: session.attendanceCount
            }
        });
        
    } catch (error) {
        console.error('Error closing session:', error);
        res.status(500).json({ 
            message: 'Error closing session',
            error: error.message 
        });
    }
});

module.exports = router;