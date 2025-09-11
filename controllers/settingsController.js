const Settings = require('../models/settings');

const settingsController = {
  // Get a setting by key
  getSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await Settings.findOne({ key });
      
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  },

  // Get all settings
  getAllSettings: async (req, res) => {
    try {
      const settings = await Settings.find().sort({ key: 1 });
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  },

  // Update or create a setting
  updateSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      
      const setting = await Settings.findOneAndUpdate(
        { key },
        { 
          key,
          value,
          description,
          updatedAt: new Date()
        },
        { 
          new: true, 
          upsert: true,
          runValidators: true 
        }
      );
      
      res.json(setting);
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  },

  // Delete a setting
  deleteSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const deletedSetting = await Settings.findOneAndDelete({ key });
      
      if (!deletedSetting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json({ message: 'Setting deleted successfully' });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  }
};

module.exports = settingsController;