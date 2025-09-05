const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path')
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const newsAdminRoutes = require('./routes/newsRoutes')
const missionAdminRoutes = require('./routes/missionRoutes')
const bsAdminRoutes = require('./routes/bsRoutes')
const superAdminRoutes = require('./routes/superAdminRoutes')
const admissionAdminRoutes = require('./routes/admissionAdminRoutes')
const commitmentRoutes = require('./routes/commitmentRoute.js')
const attendanceRoutes = require('./routes/attendanceRoutes')
const chatRoutes = require('./routes/chatRoutes')
require('dotenv').config();
const fs = require('fs');
const cors = require('cors')
const cookieParser = require ('cookie-parser');

// Ensure the 'uploads' folder exists
let uploadDir;

if (process.env.NODE_ENV === 'production') {
    // Use local uploads directory instead of /var/www/uploads for now
    uploadDir = path.join(__dirname, 'uploads');
} else {
    uploadDir = path.join(__dirname, 'uploads');
}

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const corsOptions = {
    origin: function(origin, callback) {
      console.log(`CORS Request from origin: "${origin}", NODE_ENV: "${process.env.NODE_ENV}"`);
      
      // More permissive CORS for production debugging
      if (process.env.NODE_ENV === 'development') {
        const devOrigins = ['http://localhost:5173','http://localhost:5174','http://localhost:5175','http://localhost:5176'];
        console.log(`Dev allowed origins:`, devOrigins);
        
        if (devOrigins.includes(origin) || !origin) {
          console.log(`CORS allowed for dev origin: ${origin}`);
          callback(null, true);
        } else {
          console.log(`CORS blocked for dev origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // Production: be more permissive to fix the login issues
        const prodOrigins = [
          'https://www.ksucu-mc.co.ke', 
          'https://ksucu-mc.co.ke',
          'http://www.ksucu-mc.co.ke',
          'http://ksucu-mc.co.ke'
        ];
        
        console.log(`Production allowed origins:`, prodOrigins);
        console.log(`Checking if "${origin}" is in allowed origins...`);
        
        // More flexible matching for production
        if (!origin || 
            prodOrigins.includes(origin) ||
            (origin && origin.includes('ksucu-mc.co.ke'))) {
          console.log(`CORS allowed for production origin: ${origin}`);
          callback(null, true);
        } else {
          console.log(`CORS blocked for production origin: ${origin}`);
          console.log(`Origin type: ${typeof origin}, value: "${origin}"`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true, // Allow credentials (cookies) to be sent
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';
console.log('Attempting to connect to MongoDB at:', dbUri);

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>{
    console.log('MongoDB connected successfully');
}).catch((err)=>{
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
});

app.use('/users', userRoutes);
app.use('/adminnews', newsAdminRoutes);
app.use('/news', newsAdminRoutes); // Add direct news route
app.use('/adminmission', missionAdminRoutes);
app.use('/adminBs', bsAdminRoutes);
app.use('/sadmin', superAdminRoutes);
app.use('/admissionadmin', admissionAdminRoutes);
app.use('/commitmentForm', commitmentRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/chat', chatRoutes);

// Serve uploaded files statically
if (process.env.NODE_ENV === 'production') {
    // Use local uploads directory instead of /var/www/uploads for now
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} else {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname, '../KSUCU-MC-FRONTEND/dist')));

    app.get('*', (req,res) => {
        res.sendFile(
            path.resolve(__dirname, '../', 'KSUCU-MC-FRONTEND', 'dist', 'index.html')
        )
    })
} else{
    app.get('/', (req, res) => res.send('Please set to production'))
}

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      if (process.env.NODE_ENV === 'development') {
        const devOrigins = ['http://localhost:5173','http://localhost:5174','http://localhost:5175','http://localhost:5176'];
        if (devOrigins.includes(origin) || !origin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        if (!origin || 
            (origin && (origin.includes('localhost') || 
                       origin.includes('127.0.0.1') ||
                       origin.includes('ksucu-mc.co.ke')))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true
  }
});

// Socket.IO chat functionality
const ChatMessage = require('./models/chatMessage');
const OnlineUsers = require('./models/onlineUsers');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = decoded.userId;
    socket.username = user.username;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', async (socket) => {
  console.log(`User ${socket.username} connected with socket ${socket.id}`);

  // Add user to online users
  try {
    await OnlineUsers.findOneAndUpdate(
      { userId: socket.userId },
      {
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id,
        status: 'online',
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );

    // Broadcast updated online users
    const onlineUsers = await OnlineUsers.find({ status: 'online' })
      .populate('userId', 'username')
      .select('username status lastSeen');
    io.emit('onlineUsersUpdate', onlineUsers);
  } catch (error) {
    console.error('Error updating online users:', error);
  }

  // Join the general chat room
  socket.join('community-chat');

  // Handle new message
  socket.on('sendMessage', async (data) => {
    try {
      const { message, messageType = 'text', replyTo } = data;
      
      const newMessage = new ChatMessage({
        senderId: socket.userId,
        senderName: socket.username,
        message,
        messageType,
        replyTo: replyTo || null,
      });

      await newMessage.save();
      await newMessage.populate('replyTo', 'message senderName timestamp');

      // Broadcast message to all users in the chat
      io.to('community-chat').emit('newMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message edit
  socket.on('editMessage', async (data) => {
    try {
      const { messageId, message } = data;
      
      const chatMessage = await ChatMessage.findById(messageId);
      if (!chatMessage || chatMessage.senderId.toString() !== socket.userId) {
        socket.emit('error', { message: 'Not authorized to edit this message' });
        return;
      }

      chatMessage.message = message;
      chatMessage.edited = true;
      chatMessage.editedAt = new Date();
      await chatMessage.save();

      await chatMessage.populate('replyTo', 'message senderName timestamp');

      // Broadcast updated message
      io.to('community-chat').emit('messageEdited', chatMessage);
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Handle message delete
  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId } = data;
      
      const chatMessage = await ChatMessage.findById(messageId);
      if (!chatMessage || chatMessage.senderId.toString() !== socket.userId) {
        socket.emit('error', { message: 'Not authorized to delete this message' });
        return;
      }

      chatMessage.deleted = true;
      await chatMessage.save();

      // Broadcast deleted message
      io.to('community-chat').emit('messageDeleted', { messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to('community-chat').emit('userTyping', {
      username: socket.username,
      isTyping: data.isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User ${socket.username} disconnected`);

    try {
      // Update user status to offline
      await OnlineUsers.findOneAndUpdate(
        { userId: socket.userId },
        { 
          status: 'offline',
          lastSeen: new Date()
        }
      );

      // Remove from online users after a delay (in case of reconnection)
      setTimeout(async () => {
        try {
          const stillOnline = await OnlineUsers.findOne({
            userId: socket.userId,
            status: 'online'
          });

          if (!stillOnline) {
            await OnlineUsers.findOneAndDelete({ userId: socket.userId });
          }

          // Broadcast updated online users
          const onlineUsers = await OnlineUsers.find({ status: 'online' })
            .populate('userId', 'username')
            .select('username status lastSeen');
          io.emit('onlineUsersUpdate', onlineUsers);
        } catch (error) {
          console.error('Error cleaning up offline user:', error);
        }
      }, 30000); // 30 seconds delay

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
