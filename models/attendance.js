const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
    ministry: {
        type: String,
        required: true,
        enum: ['Praise and Worship', 'Choir', 'Wananzambe', 'Ushering', 'Creativity', 'Compassion', 'Intercessory', 'High School', 'Church School', 'General']
    },
    leadershipRole: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    attendanceCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const attendanceRecordSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceSession',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow null for anonymous attendance
    },
    userName: {
        type: String,
        required: true
    },
    regNo: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    ministry: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false
    },
    signature: {
        type: String,
        required: false
    },
    signedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure a registration number can only sign once per session
attendanceRecordSchema.index({ sessionId: 1, regNo: 1 }, { unique: true });

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

module.exports = {
    AttendanceSession,
    AttendanceRecord
};