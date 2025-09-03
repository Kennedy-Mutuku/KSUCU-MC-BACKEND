const express = require('express');
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

app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const corsOptions = {
    origin: function(origin, callback) {
      console.log(`CORS Request from origin: "${origin}", NODE_ENV: "${process.env.NODE_ENV}"`);
      
      const allowedOrigins = process.env.NODE_ENV === 'development'
      ? ['http://localhost:5173','http://localhost:5174','http://localhost:5175'] // Add your development origins here
      : ['https://www.ksucu-mc.co.ke', 'https://ksucu-mc.co.ke'];
      
      console.log(`Allowed origins:`, allowedOrigins);
  
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        console.log(`CORS allowed for origin: ${origin}`);
        callback(null, true);
      } else {
        console.log(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow credentials (cookies) to be sent
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
