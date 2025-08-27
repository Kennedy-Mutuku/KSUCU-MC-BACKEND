require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../models/superAdmin');

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_CONNECTION_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Super admin credentials
        const email = 'admin@ksucumcsuperadmin.co.ke';
        const password = 'newsAdmin01q7';
        const phone = '+254700000000'; // You can change this to a real phone number

        // Check if super admin already exists
        const existingAdmin = await SuperAdmin.findOne({ email });
        if (existingAdmin) {
            console.log('Super admin already exists with email:', email);
            console.log('Updating password...');
            
            // Update the password
            const hashedPassword = await bcrypt.hash(password, 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.phone = phone;
            await existingAdmin.save();
            
            console.log('Super admin password updated successfully!');
        } else {
            // Create new super admin
            const hashedPassword = await bcrypt.hash(password, 10);
            const newAdmin = new SuperAdmin({
                email,
                password: hashedPassword,
                phone
            });

            await newAdmin.save();
            console.log('Super admin created successfully!');
            console.log('Email:', email);
            console.log('Password:', password);
        }

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
createSuperAdmin();