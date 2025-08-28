const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
    ministry: {
        type: String,
        required: true,
        enum: ['Praise and Worship', 'Choir', 'Wananzambe']
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
        required: true
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
    signedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure a user can only sign once per session
attendanceRecordSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

module.exports = {
    AttendanceSession,
    AttendanceRecord
};