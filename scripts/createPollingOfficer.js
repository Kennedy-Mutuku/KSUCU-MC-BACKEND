const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

// Import models
const PollingOfficer = require('../models/pollingOfficer');
const SuperAdmin = require('../models/superAdmin');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createPollingOfficer() {
    try {
        // Connect to MongoDB
        const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully!\n');

        // Get the first super admin as the creator
        const superAdmin = await SuperAdmin.findOne();
        if (!superAdmin) {
            console.error('Error: No super admin found. Please create a super admin first.');
            process.exit(1);
        }

        // Collect polling officer details
        console.log('===== Create New Polling Officer =====\n');

        const fullName = await question('Full Name: ');
        const email = await question('Email: ');
        const phone = await question('Phone: ');
        const password = await question('Password: ');

        // Validate input
        if (!fullName || !email || !phone || !password) {
            console.error('\nError: All fields are required!');
            process.exit(1);
        }

        // Check if officer already exists
        const existingOfficer = await PollingOfficer.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingOfficer) {
            console.error('\nError: An officer with this email or phone already exists!');
            process.exit(1);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new polling officer
        const newOfficer = new PollingOfficer({
            fullName,
            email,
            phone,
            password: hashedPassword,
            createdBy: superAdmin._id,
            status: 'active'
        });

        await newOfficer.save();

        console.log('\n✅ Polling officer created successfully!');
        console.log('\nOfficer Details:');
        console.log(`  Full Name: ${newOfficer.fullName}`);
        console.log(`  Email: ${newOfficer.email}`);
        console.log(`  Phone: ${newOfficer.phone}`);
        console.log(`  Status: ${newOfficer.status}`);
        console.log(`  Created At: ${newOfficer.createdAt}`);
        console.log('\nThe officer can now log in at: /polling-officer-dashboard\n');

    } catch (error) {
        console.error('\n❌ Error creating polling officer:', error.message);
        process.exit(1);
    } finally {
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
    }
}

// Run the script
createPollingOfficer();
