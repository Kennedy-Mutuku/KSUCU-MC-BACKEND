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

// Get current active session status (for cross-device checking) - MUST come before /session/:ministry
router.get('/session/status', async (req, res) => {
    try {
        console.log('🔍 Checking session status for cross-device sync...');
        
        // Add no-cache headers to prevent caching issues
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        // Find any active session (only one can be active at a time)
        const activeSession = await AttendanceSession.findOne({ isActive: true });
        
        if (!activeSession) {
            console.log('❌ No active session found');
            return res.json({
                message: 'No active session',
                session: null
            });
        }
        
        // Get real-time attendance count
        const attendanceCount = await AttendanceRecord.countDocuments({
            sessionId: activeSession._id
        });
        
        console.log(`✅ Active session found: ${activeSession.leadershipRole} (${attendanceCount} attendees)`);
        
        res.json({
            message: 'Active session found',
            session: {
                _id: activeSession._id,
                leadershipRole: activeSession.leadershipRole,
                ministry: activeSession.ministry,
                isActive: activeSession.isActive,
                startTime: activeSession.startTime,
                endTime: activeSession.endTime,
                attendanceCount: attendanceCount
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

// Get session for ministry - now returns ANY active session for cross-device sync  
router.get('/session/:ministry', async (req, res) => {
    try {
        // For cross-device sync, return the global active session regardless of ministry
        // This ensures all devices see the same session
        const activeSession = await AttendanceSession.findOne({ 
            isActive: true 
        });
        
        if (!activeSession) {
            // No active session - check for recently closed sessions
            const recentSession = await AttendanceSession.findOne({})
                .sort({ createdAt: -1 })
                .limit(1);
                
            if (recentSession && recentSession.endTime) {
                // Show recently closed session for reference
                return res.json({
                    message: 'Session closed',
                    session: recentSession,
                    userSigned: false
                });
            }
            
            return res.json({ 
                message: 'No session found',
                session: null 
            });
        }
        
        // Active session found
        let userSigned = false;
        const token = req.cookies.token;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const existingRecord = await AttendanceRecord.findOne({
                    sessionId: activeSession._id,
                    userId: decoded.id
                });
                userSigned = !!existingRecord;
            } catch (error) {
                // Token invalid, ignore
            }
        }
        
        res.json({
            session: activeSession,
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

// Anonymous attendance signing (for users without accounts)
router.post('/sign-anonymous', async (req, res) => {
    try {
        const { sessionId, ministry, name, regNo, year, phoneNumber, signature } = req.body;
        
        console.log('📝 ========== NEW ATTENDANCE SUBMISSION ==========');
        console.log('📝 Received anonymous attendance submission:', {
            sessionId,
            ministry,
            name,
            regNo,
            year,
            hasPhoneNumber: !!phoneNumber,
            hasSignature: !!signature,
            timestamp: new Date().toISOString()
        });
        console.log('📝 Raw regNo before processing:', JSON.stringify(regNo));
        
        if (!sessionId || !ministry || !name || !regNo || !year) {
            const errorMessage = 'Session ID, ministry, name, registration number, and year are required';
            return res.status(400).json({ 
                message: errorMessage,
                error: errorMessage // Consistent error format
            });
        }
        
        // Find the session with enhanced debugging
        console.log(`🔍 Looking for session with ID: "${sessionId}"`);
        const session = await AttendanceSession.findById(sessionId);
        
        if (!session) {
            const errorMessage = 'Session not found';
            console.log(`❌ SESSION NOT FOUND for ID: "${sessionId}"`);
            return res.status(404).json({ 
                message: errorMessage,
                error: errorMessage 
            });
        }
        
        console.log(`✅ Session found:`, {
            id: session._id,
            ministry: session.ministry,
            leadershipRole: session.leadershipRole,
            isActive: session.isActive,
            startTime: session.startTime,
            attendanceCount: session.attendanceCount
        });
        
        if (!session.isActive) {
            const errorMessage = 'This attendance session is closed';
            console.log(`❌ Session is not active:`, session.isActive);
            return res.status(400).json({ 
                message: errorMessage,
                error: errorMessage 
            });
        }
        
        // Check for duplicate registration number in this session ONLY
        const regNoToCheck = regNo.trim().toUpperCase();
        console.log(`🔍 Checking for duplicate regNo: "${regNoToCheck}" in session: ${sessionId}`);
        
        const existingRecord = await AttendanceRecord.findOne({
            sessionId: sessionId,
            regNo: regNoToCheck
        });
        
        if (existingRecord) {
            const errorMessage = `Registration number ${regNoToCheck} has already signed attendance for this session`;
            console.log('⚠️ DUPLICATE FOUND - Registration already exists:', {
                regNo: regNoToCheck,
                existingUserName: existingRecord.userName,
                existingSignedAt: existingRecord.signedAt
            });
            return res.status(400).json({ 
                message: errorMessage,
                error: errorMessage
            });
        }
        
        console.log(`✅ No duplicate found for regNo: "${regNoToCheck}" - proceeding with registration`);
        
        // Create attendance record
        const attendanceRecord = new AttendanceRecord({
            sessionId,
            userId: null, // No user ID for anonymous signing
            userName: name.trim(),
            regNo: regNoToCheck, // Use the already processed regNo
            year: parseInt(year),
            ministry,
            phoneNumber: phoneNumber?.trim() || '',
            signature: signature || '',
            signedAt: new Date()
        });
        
        console.log(`📝 Creating new attendance record:`, {
            sessionId: sessionId,
            userName: name.trim(),
            regNo: regNoToCheck,
            year: parseInt(year),
            ministry: ministry
        });
        
        await attendanceRecord.save();
        
        // Update session attendance count
        session.attendanceCount += 1;
        await session.save();
        
        console.log(`✅ SUCCESS: Anonymous attendance signed: ${name.trim()} (${regNoToCheck}) for ${ministry}`);
        console.log(`   Session ID: ${sessionId}`);
        console.log(`   Record ID: ${attendanceRecord._id}`);
        console.log(`   Total attendees in session: ${session.attendanceCount}`);
        
        res.json({
            message: 'Attendance signed successfully',
            record: {
                _id: attendanceRecord._id,
                userName: attendanceRecord.userName,
                regNo: attendanceRecord.regNo,
                year: attendanceRecord.year,
                phoneNumber: attendanceRecord.phoneNumber,
                ministry: attendanceRecord.ministry,
                signedAt: attendanceRecord.signedAt,
                signature: attendanceRecord.signature
            }
        });
        
    } catch (error) {
        console.error('❌ ERROR signing anonymous attendance:', error);
        
        // Handle MongoDB duplicate key error specifically
        if (error.code === 11000) {
            console.log('🔍 MongoDB duplicate key error details:', {
                code: error.code,
                keyPattern: error.keyPattern,
                keyValue: error.keyValue,
                fullError: error
            });
            
            const errorMessage = 'This registration number has already signed attendance for this session';
            return res.status(400).json({ 
                message: errorMessage,
                error: errorMessage 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            console.log('🔍 Mongoose validation error:', error.errors);
            const errorMessage = 'Invalid data provided for attendance';
            return res.status(400).json({ 
                message: errorMessage,
                error: errorMessage 
            });
        }
        
        // Handle other errors
        console.log('🔍 Unexpected error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        const errorMessage = error.message || 'Error signing attendance';
        res.status(500).json({ 
            message: 'Error signing attendance',
            error: errorMessage 
        });
    }
});

// Sign attendance (for logged-in users)
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
            regNo: user.reg || 'N/A',
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
        
        console.log(`📊 Fetching attendance records for session: ${sessionId}`);
        
        // Add no-cache headers for real-time sync
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        // Validate session ID format
        if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
            return res.status(400).json({ 
                message: 'Invalid session ID',
                sessionId 
            });
        }
        
        const records = await AttendanceRecord.find({ sessionId })
            .populate('userId', 'username email')
            .sort({ signedAt: 1 });
        
        console.log(`✅ Found ${records.length} attendance records for session ${sessionId}`);
        
        // Log first few records for debugging
        if (records.length > 0) {
            console.log('Recent records:', records.slice(-3).map(r => ({
                name: r.userName,
                regNo: r.regNo,
                signedAt: r.signedAt
            })));
        }
            
        res.json({
            records,
            count: records.length,
            sessionId,
            timestamp: new Date().toISOString() // Add timestamp for debugging
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
        
        // Find any active session (removed leadershipRole restriction for flexibility)
        const session = await AttendanceSession.findOne({ 
            isActive: true
        });
        
        if (!session) {
            return res.status(404).json({ 
                message: 'No active session found to close' 
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

// Force close any active session (emergency override)
router.post('/session/force-close', async (req, res) => {
    try {
        const { newLeadershipRole } = req.body;
        
        if (!newLeadershipRole) {
            return res.status(400).json({ message: 'New leadership role is required' });
        }
        
        // Find any active session
        const activeSession = await AttendanceSession.findOne({ isActive: true });
        
        if (!activeSession) {
            return res.status(404).json({ 
                message: 'No active session found to close' 
            });
        }
        
        const oldLeadershipRole = activeSession.leadershipRole;
        
        // Force close the session
        activeSession.isActive = false;
        activeSession.endTime = new Date();
        activeSession.forcedClosedBy = newLeadershipRole;
        
        await activeSession.save();
        
        console.log(`⚠️ Session forcefully closed by ${newLeadershipRole} - was owned by ${oldLeadershipRole} - ${activeSession.attendanceCount} attendees`);
        
        res.json({
            message: `Session forcefully closed. Previous session by ${oldLeadershipRole} has been terminated.`,
            closedSession: {
                _id: activeSession._id,
                leadershipRole: oldLeadershipRole,
                ministry: activeSession.ministry,
                isActive: false,
                startTime: activeSession.startTime,
                endTime: activeSession.endTime,
                attendanceCount: activeSession.attendanceCount,
                forcedClosedBy: newLeadershipRole
            }
        });
        
    } catch (error) {
        console.error('Error force closing session:', error);
        res.status(500).json({ 
            message: 'Error force closing session',
            error: error.message 
        });
    }
});

// DEBUG ROUTE: Get all records for debugging (remove in production)
router.get('/debug/records/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        console.log(`🔍 DEBUG: Fetching ALL records for session: ${sessionId}`);
        
        const records = await AttendanceRecord.find({ sessionId })
            .sort({ signedAt: 1 });
        
        console.log(`🔍 DEBUG: Found ${records.length} records:`);
        records.forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.userName} - ${record.regNo} - ${record.signedAt}`);
        });
        
        res.json({
            sessionId,
            totalRecords: records.length,
            records: records.map(r => ({
                _id: r._id,
                userName: r.userName,
                regNo: r.regNo,
                year: r.year,
                ministry: r.ministry,
                signedAt: r.signedAt
            }))
        });
        
    } catch (error) {
        console.error('Error getting debug records:', error);
        res.status(500).json({ 
            message: 'Error getting debug records',
            error: error.message 
        });
    }
});

module.exports = router;