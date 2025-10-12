const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config();

const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';

// Sample data arrays
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Mary', 'Robert', 'Linda',
                    'Peter', 'Grace', 'Daniel', 'Faith', 'Joseph', 'Ruth', 'Samuel', 'Esther', 'Brian', 'Sharon'];
const lastNames = ['Kamau', 'Wanjiru', 'Ochieng', 'Akinyi', 'Kipchoge', 'Wambui', 'Mwangi', 'Njeri', 'Otieno', 'Chepkoech',
                   'Mutua', 'Adhiambo', 'Kimani', 'Wairimu', 'Kariuki', 'Chebet', 'Mwendwa', 'Juma', 'Kibet', 'Nekesa'];
const courses = ['Computer Science', 'Business Administration', 'Engineering', 'Education', 'Nursing', 'Economics', 'Law', 'Agriculture'];
const ministries = ['Praise & Worship', 'Media', 'Ushering', 'Choir', 'Evangelism', 'Prayer', 'Welfare', 'IT'];
const yearOfStudy = [1, 2, 3, 4];
const emailTypes = ['personal', 'school'];

// Helper function to generate random email
function generateEmail(firstName, lastName) {
    const type = emailTypes[Math.floor(Math.random() * emailTypes.length)];
    const randomNum = Math.floor(Math.random() * 1000);

    if (type === 'school') {
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@students.ksu.ac.ke`;
    } else {
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@gmail.com`;
    }
}

// Helper function to generate random phone
function generatePhone() {
    const prefixes = ['0710', '0720', '0730', '0740', '0750', '0768', '0769', '0797', '0798', '0799'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return prefix + randomDigits;
}

// Helper function to generate registration number
function generateRegNo() {
    const year = 2020 + Math.floor(Math.random() * 5); // 2020-2024
    const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4 digit number
    return `${year}${randomNum}`;
}

// Helper function to generate random user
function generateRandomUser(index) {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    const username = `${firstName} ${lastName}`;

    return {
        username,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        reg: generateRegNo(),
        course: courses[Math.floor(Math.random() * courses.length)],
        yos: yearOfStudy[Math.floor(Math.random() * yearOfStudy.length)],
        ministry: ministries[Math.floor(Math.random() * ministries.length)],
        et: Math.random() > 0.5 ? 'baptised' : 'saved',
        password: 'testuser123', // Default password for all test users
        hasVoted: false // All users start as not voted
    };
}

// Main function to create users
async function createTestUsers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        console.log('\n📝 Creating 20 test users...\n');

        const createdUsers = [];

        for (let i = 0; i < 20; i++) {
            const userData = generateRandomUser(i);

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [
                    { email: userData.email },
                    { phone: userData.phone },
                    { reg: userData.reg }
                ]
            });

            if (existingUser) {
                console.log(`⚠️  User ${i + 1}: ${userData.username} - Already exists (skipping)`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;

            // Create user
            const newUser = new User(userData);
            await newUser.save();

            createdUsers.push({
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
                reg: userData.reg,
                course: userData.course,
                yos: userData.yos,
                ministry: userData.ministry
            });

            console.log(`✅ User ${i + 1}: ${userData.username} created successfully`);
            console.log(`   Email: ${userData.email}`);
            console.log(`   Phone: ${userData.phone}`);
            console.log(`   Reg No: ${userData.reg}`);
            console.log(`   Course: ${userData.course}`);
            console.log(`   Year: ${userData.yos}`);
            console.log(`   Ministry: ${userData.ministry}`);
            console.log(`   Password: testuser123 (default)`);
            console.log('');
        }

        console.log(`\n✅ Successfully created ${createdUsers.length} test users!`);
        console.log('\n📊 Summary:');
        console.log(`   Total users created: ${createdUsers.length}`);
        console.log(`   All users have hasVoted: false`);
        console.log(`   Default password: testuser123`);

        console.log('\n📋 Created Users:');
        console.table(createdUsers.map((user, index) => ({
            No: index + 1,
            Name: user.username,
            Email: user.email,
            Phone: user.phone,
            RegNo: user.reg,
            Course: user.course
        })));

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating test users:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the script
createTestUsers();
