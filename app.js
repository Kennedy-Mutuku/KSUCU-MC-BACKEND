const express = require('express');
const path = require('path')
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const newsAdminRoutes = require('./routes/newsRoutes')
const missionAdminRoutes = require('./routes/missionRoutes')
const bsAdminRoutes = require('./routes/bsRoutes')
const superAdminRoutes = require('./routes/superAdminRoutes')
const commitmentRoutes = require('./routes/commitmentRoute.js')
const session = require('express-session');
require('dotenv').config();
const fs = require('fs');
const cors = require('cors')
const cookieParser = require ('cookie-parser');
const passport = require('passport')
require('./helperModules/passport-setup.js');
const dbuser = require('./models/user.js')
const jwt = require('jsonwebtoken');

// Ensure the 'uploads' folder exists
let uploadDir;

if (process.env.NODE_ENV === 'production') {
    uploadDir = '/var/www/uploads';
} else {
    uploadDir = path.join(__dirname, 'uploads');
}

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const app = express();

app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const corsOptions = {
    origin: function(origin, callback) {
      const allowedOrigins = process.env.NODE_ENV === 'development'
      ? ['http://localhost:5173']
      : ['https://www.ksucu-mc.co.ke', 'https://ksucu-mc.co.ke'];
  
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        // Allow requests from the allowed origins or from no origin (e.g., non-browser clients)
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow credentials (cookies) to be sent
};
app.use(cors(corsOptions));

mongoose.connect(process.env.DB_CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>{
    console.log('db connected succesfully');
}).catch((err)=>{
    console.log(err.message);
});

app.use('/users', userRoutes);
app.use('/adminnews', newsAdminRoutes);
app.use('/adminmission', missionAdminRoutes);
app.use('/adminBs', bsAdminRoutes);
app.use('/sadmin', superAdminRoutes);
app.use('/commitmentForm', commitmentRoutes);

// Serve uploaded files statically
if (process.env.NODE_ENV === 'production') {
    app.use('/uploads', express.static('/var/www/uploads'));
} else {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}


// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.use(session({
  name: 'sessionManager',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true in production for HTTPS
    httpOnly: true, // Ensures cookies are only accessible over HTTP(S)
    maxAge: 3 * 60 * 60 * 1000, // 3 hours 
    sameSite: 'lax'
  }
}));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: process.env.GOOGLE_AUTH_REDIRECT }), async (req, res) => {
console.log('User authenticated:', req.user);
console.log('Session ID:', req.sessionID);
console.log('Session data:', req.session);

if (req.user) {
    const userEmail = req.user.email.toLowerCase();
    const User = await dbuser.findOne({ email: userEmail });
    const token = jwt.sign({ userId: User._id }, process.env.JWT_USER_SECRET, { expiresIn: '1h' });

    res.cookie('user_s', token, {
        httpOnly: true,
        secure: true, // Set to true in production
        maxAge: 3 * 60 * 60 * 1000, // 3 hours (match session maxAge)
        sameSite: 'lax'
    });

    // Setting the `user_login` cookie
    res.cookie('loginToken', 'user_login', {
      httpOnly: false, // Accessible to JavaScript
      secure: true,    // Set to true in production (HTTPS)
      maxAge: 3 * 60 * 60 * 1000, // 3 hours
      sameSite: 'lax'
  });

} else {
    console.error('No user found in session');
}

res.redirect(process.env.GOOGLE_AUTH_REDIRECT);

});

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
