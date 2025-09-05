const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bsAdmin = require('../models/bsAdmin');
require('dotenv').config();

async function createBsAdmin() {
    try {
        const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';
        console.log('Connecting to MongoDB at:', dbUri);
        
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB successfully');

        const email = 'admin@ksucu.com';
        const password = 'admin123';
        const phone = '0700000000';

        // Check if admin already exists
        const existingAdmin = await bsAdmin.findOne({ email });
        if (existingAdmin) {
            console.log('BS Admin already exists with email:', email);
            return;
        }

        // Create new admin
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new bsAdmin({
            email,
            phone,
            password: hashedPassword
        });

        await newAdmin.save();
        console.log('✅ BS Admin created successfully!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('⚠️  Change these credentials in production!');
        
        await mongoose.connection.close();
        console.log('Database connection closed');
        
    } catch (error) {
        console.error('Error creating BS admin:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createBsAdmin();
}

module.exports = createBsAdmin;