const mongoose = require('mongoose');
const Residence = require('../models/residence');
require('dotenv').config();

const defaultResidences = [
    { name: 'Kisumu ndogo', description: 'Near town center' },
    { name: 'Nyamage', description: 'University area' },
    { name: 'Fanta', description: 'Student residential area' }
];

async function seedDefaultResidences() {
    try {
        const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';
        console.log('Connecting to MongoDB at:', dbUri);
        
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB successfully');

        // Check if residences already exist
        const existingCount = await Residence.countDocuments();
        if (existingCount > 0) {
            console.log(`Found ${existingCount} existing residences. Checking for defaults...`);
            
            // Add only missing defaults
            for (const defaultRes of defaultResidences) {
                const exists = await Residence.findOne({ 
                    name: { $regex: new RegExp(`^${defaultRes.name}$`, 'i') } 
                });
                if (!exists) {
                    await Residence.create(defaultRes);
                    console.log(`Added missing default residence: ${defaultRes.name}`);
                }
            }
        } else {
            console.log('No residences found. Creating default residences...');
            await Residence.insertMany(defaultResidences);
            console.log('Default residences created successfully');
        }

        const totalCount = await Residence.countDocuments();
        console.log(`Total residences in database: ${totalCount}`);
        
        await mongoose.connection.close();
        console.log('Database connection closed');
        
    } catch (error) {
        console.error('Error seeding residences:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedDefaultResidences();
}

module.exports = seedDefaultResidences;