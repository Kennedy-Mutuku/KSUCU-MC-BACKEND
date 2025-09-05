const mongoose = require('mongoose');
const Residence = require('../models/residence');
require('dotenv').config();

const defaultResidences = [
  { name: 'Kisumu ndogo', description: 'Student residence area near campus', isActive: true },
  { name: 'Nyamage', description: 'Popular student accommodation area', isActive: true },
  { name: 'Fanta', description: 'Student housing area', isActive: true },
  { name: 'Kondele', description: 'Student accommodation area', isActive: true },
  { name: 'Migosi', description: 'Student residential area', isActive: true }
];

async function seedResidences() {
  try {
    const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';
    console.log('Connecting to MongoDB at:', dbUri);
    
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');

    // Check if residences already exist
    const existingResidences = await Residence.find();
    console.log(`Found ${existingResidences.length} existing residences`);

    if (existingResidences.length === 0) {
      console.log('No residences found. Creating default residences...');
      
      const createdResidences = await Residence.insertMany(defaultResidences);
      console.log(`✅ Successfully created ${createdResidences.length} residences:`);
      createdResidences.forEach(r => console.log(`  - ${r.name}`));
    } else {
      console.log('Residences already exist. Skipping seeding.');
      existingResidences.forEach(r => console.log(`  - ${r.name} (${r.isActive ? 'Active' : 'Inactive'})`));
    }

  } catch (error) {
    console.error('Error seeding residences:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedResidences();
}

module.exports = seedResidences;