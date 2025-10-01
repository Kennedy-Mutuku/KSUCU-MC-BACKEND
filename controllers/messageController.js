const Message = require('../models/message');

// Submit a message (anonymous or identified)
exports.submitMessage = async (req, res) => {
    try {
        const { subject, message, category, isAnonymous, senderInfo, timestamp } = req.body;

        // Validate required fields
        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Subject and message are required'
            });
        }

        // Create new message
        const newMessage = new Message({
            subject: subject.trim(),
            message: message.trim(),
            category: category || 'feedback',
            isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
            senderInfo: !isAnonymous && senderInfo ? senderInfo : null,
            timestamp: timestamp || new Date(),
            isRead: false,
            status: 'new'
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: 'Message submitted successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Error submitting message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit message',
            error: error.message
        });
    }
};

// Get all messages (admin only)
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .lean();

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
};

// Update message status
exports.updateMessageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isRead } = req.body;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (status) message.status = status;
        if (isRead !== undefined) message.isRead = isRead;

        await message.save();

        res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            data: message
        });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update message',
            error: error.message
        });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await Message.findByIdAndDelete(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
};
