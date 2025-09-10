const mongoose = require('mongoose');
const MediaItem = require('../models/MediaItem');
require('dotenv').config();

const defaultItems = [
  { event: "Subcomm photos", date: "2025-01-20", link: "https://photos.app.goo.gl/PrxWoMuyRNEet22b7" },
  { event: "Sunday service", date: "2025-22-13", link: "https://photos.app.goo.gl/Vt6HDo1xEtgA3Nmn9" },
  { event: "Worship Weekend", date: "2025-02-10", link: "https://photos.app.goo.gl/wbNV3coJREGEUSZX7" },
  { event: "Bible Study weekend", date: "2025-01-26", link: "https://photos.app.goo.gl/otVcso25sG6fkxjR8" },
  { event: "Evangelism photos", date: "2025-02-02", link: "https://photos.app.goo.gl/JvqV19BaGGZwrVFS7" },
  { event: "Weekend Photos", date: "2025-02-09", link: "https://photos.app.goo.gl/HkBvW67gyDSvLqgS7" },
  { event: "KSUCU-MC MEGA HIKE", date: "2025-02-15", link: "https://photos.app.goo.gl/RaNP4ikjEjXLHBmbA" },
  { event: "Creative Night photos", date: "2025-02-11", link: "https://photos.app.goo.gl/qYjukQAuWAdzBpaA7" },
  { event: "Valentine's concert ", date: "2025-02-17", link: "https://photos.app.goo.gl/BvYon9KCNPL1uMu87" },
  { event: "Weekend Photos", date: "2025-02-17", link: "https://photos.app.goo.gl/gMuMfKPvCx3rTRRn8" },
  { event: "Worship Weekend", date: "14th - 16th march", link: "https://photos.app.goo.gl/t2uVjvUSepDBcx3LA" },
  { event: "Prayer Week", date: "7th - 9th March", link: "https://photos.app.goo.gl/24sm1zdBxdUege3Y6" },
  { event: "Elders Day", date: "22nd March", link: "https://photos.app.goo.gl/L9Hkr8BxnVP1MSsD6" },
  { event: "Hymn Sunday", date: "23nd March", link: "https://photos.app.goo.gl/RWWRM2zp9LkmVgtU6" },
  { event: "Sunday service", date: "24nd March", link: "https://photos.app.goo.gl/UnA7f6Aqp3kHtsxaA" },
];

async function migrateMediaItems() {
  try {
    // Connect to MongoDB
    const dbUri = process.env.DB_CONNECTION_URI || 'mongodb://127.0.0.1:27017/ksucu-mc';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if media items already exist
    const existingCount = await MediaItem.countDocuments();
    if (existingCount > 0) {
      console.log(`Media items already exist (${existingCount} items). Skipping migration.`);
      process.exit(0);
    }

    // Insert default items
    const insertedItems = await MediaItem.insertMany(defaultItems);
    console.log(`Successfully migrated ${insertedItems.length} media items to the database.`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateMediaItems();