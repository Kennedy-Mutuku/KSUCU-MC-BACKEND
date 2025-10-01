require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../models/superAdmin');

async function createMessageAdmin() {
    try {
        // Connect to MongoDB
        const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB at:', dbUri);

        // Message Admin credentials
        const adminData = {
            email: 'messages@ksucumcsuperadmin.co.ke',
            password: 'messages123',
            phone: '+254700999888'
        };

        // Check if admin already exists
        const existingAdmin = await SuperAdmin.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Message admin already exists with email:', adminData.email);
            console.log('Updating password...');

            // Update the password
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.phone = adminData.phone;
            await existingAdmin.save();

            console.log('Message admin password updated successfully!');
        } else {
            // Create new message admin
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            const newAdmin = new SuperAdmin({
                email: adminData.email,
                password: hashedPassword,
                phone: adminData.phone
            });

            await newAdmin.save();
            console.log('Message admin created successfully!');
        }

        console.log('\n=== Message Admin Credentials ===');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);
        console.log('Phone:', adminData.phone);
        console.log('\nThis admin can:');
        console.log('- View all feedback messages at /messages-admin');
        console.log('- Access super admin dashboard at /admin');
        console.log('- Login at /admin (use super admin login)');
        console.log('==================================\n');

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
createMessageAdmin();
