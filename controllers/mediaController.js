const MediaItem = require('../models/MediaItem');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for media image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported'), false);
    }
  }
}).single('image');

exports.getAllMediaItems = async (req, res) => {
  try {
    const mediaItems = await MediaItem.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: mediaItems
    });
  } catch (error) {
    console.error('Error fetching media items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media items',
      error: error.message
    });
  }
};

exports.createMediaItem = async (req, res) => {
  try {
    const { event, date, link, imageUrl } = req.body;
    
    const newMediaItem = new MediaItem({
      event,
      date,
      link,
      imageUrl: imageUrl || ''
    });
    
    const savedItem = await newMediaItem.save();
    
    res.status(201).json({
      success: true,
      data: savedItem
    });
  } catch (error) {
    console.error('Error creating media item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating media item',
      error: error.message
    });
  }
};

exports.updateMediaItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { event, date, link, imageUrl } = req.body;
    
    const updatedItem = await MediaItem.findByIdAndUpdate(
      id,
      { 
        event, 
        date, 
        link, 
        imageUrl: imageUrl || '',
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Media item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating media item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating media item',
      error: error.message
    });
  }
};

exports.deleteMediaItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItem = await MediaItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Media item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Media item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting media item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting media item',
      error: error.message
    });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No image file uploaded' 
        });
      }

      const imageUrl = `/uploads/media/${req.file.filename}`;
      
      res.status(200).json({
        success: true,
        imageUrl: imageUrl,
        message: 'Image uploaded successfully'
      });
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

exports.migrateFromLocalStorage = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }
    
    const existingItems = await MediaItem.find();
    
    if (existingItems.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Media items already migrated',
        data: existingItems
      });
    }
    
    const savedItems = await MediaItem.insertMany(
      items.map(item => ({
        event: item.event,
        date: item.date,
        link: item.link,
        imageUrl: item.imageUrl || ''
      }))
    );
    
    res.status(201).json({
      success: true,
      message: 'Media items migrated successfully',
      data: savedItems
    });
  } catch (error) {
    console.error('Error migrating media items:', error);
    res.status(500).json({
      success: false,
      message: 'Error migrating media items',
      error: error.message
    });
  }
};