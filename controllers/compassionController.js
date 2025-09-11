const CompassionRequest = require('../models/compassionRequest');
const CompassionDonation = require('../models/compassionDonation');
const CompassionSettings = require('../models/compassionSettings');

const compassionController = {
  // ===== HELP REQUESTS =====
  
  // Create new help request
  createHelpRequest: async (req, res) => {
    try {
      const newRequest = new CompassionRequest(req.body);
      const savedRequest = await newRequest.save();
      
      console.log('New help request created:', {
        id: savedRequest._id,
        name: savedRequest.name,
        urgency: savedRequest.urgency,
        helpType: savedRequest.helpType
      });
      
      res.status(201).json({
        message: 'Help request submitted successfully',
        request: savedRequest
      });
    } catch (error) {
      console.error('Error creating help request:', error);
      res.status(500).json({ 
        error: 'Failed to submit help request',
        message: error.message 
      });
    }
  },

  // Get all help requests (Admin only)
  getAllHelpRequests: async (req, res) => {
    try {
      const requests = await CompassionRequest.find()
        .sort({ urgency: 1, submittedAt: -1 }); // Sort by urgency (emergency first) then date
      
      res.json({
        message: 'Help requests retrieved successfully',
        requests: requests
      });
    } catch (error) {
      console.error('Error fetching help requests:', error);
      res.status(500).json({ 
        error: 'Failed to fetch help requests',
        message: error.message 
      });
    }
  },

  // Get help request by ID
  getHelpRequest: async (req, res) => {
    try {
      const request = await CompassionRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ error: 'Help request not found' });
      }
      res.json(request);
    } catch (error) {
      console.error('Error fetching help request:', error);
      res.status(500).json({ 
        error: 'Failed to fetch help request',
        message: error.message 
      });
    }
  },

  // Update help request status (Admin only)
  updateHelpRequest: async (req, res) => {
    try {
      const { requestId, status, notes, assignedTo } = req.body;
      
      const updatedRequest = await CompassionRequest.findByIdAndUpdate(
        requestId,
        { 
          status, 
          notes, 
          assignedTo,
          lastUpdated: new Date()
        },
        { new: true }
      );

      if (!updatedRequest) {
        return res.status(404).json({ error: 'Help request not found' });
      }

      console.log('Help request updated:', {
        id: updatedRequest._id,
        status: updatedRequest.status,
        assignedTo: updatedRequest.assignedTo
      });

      res.json({
        message: 'Help request updated successfully',
        request: updatedRequest
      });
    } catch (error) {
      console.error('Error updating help request:', error);
      res.status(500).json({ 
        error: 'Failed to update help request',
        message: error.message 
      });
    }
  },

  // Delete help request (Admin only)
  deleteHelpRequest: async (req, res) => {
    try {
      const deletedRequest = await CompassionRequest.findByIdAndDelete(req.params.id);
      if (!deletedRequest) {
        return res.status(404).json({ error: 'Help request not found' });
      }
      
      console.log('Help request deleted:', deletedRequest._id);
      res.json({ message: 'Help request deleted successfully' });
    } catch (error) {
      console.error('Error deleting help request:', error);
      res.status(500).json({ 
        error: 'Failed to delete help request',
        message: error.message 
      });
    }
  },

  // ===== DONATIONS =====

  // Create new donation
  createDonation: async (req, res) => {
    try {
      const newDonation = new CompassionDonation(req.body);
      const savedDonation = await newDonation.save();
      
      console.log('New donation created:', {
        id: savedDonation._id,
        donor: savedDonation.anonymous ? 'Anonymous' : savedDonation.donorName,
        type: savedDonation.donationType,
        amount: savedDonation.amount
      });
      
      res.status(201).json({
        message: 'Donation submitted successfully',
        donation: savedDonation
      });
    } catch (error) {
      console.error('Error creating donation:', error);
      res.status(500).json({ 
        error: 'Failed to submit donation',
        message: error.message 
      });
    }
  },

  // Get all donations (Admin only)
  getAllDonations: async (req, res) => {
    try {
      const donations = await CompassionDonation.find()
        .sort({ submittedAt: -1 });
      
      res.json({
        message: 'Donations retrieved successfully',
        donations: donations
      });
    } catch (error) {
      console.error('Error fetching donations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch donations',
        message: error.message 
      });
    }
  },

  // Get donation by ID
  getDonation: async (req, res) => {
    try {
      const donation = await CompassionDonation.findById(req.params.id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }
      res.json(donation);
    } catch (error) {
      console.error('Error fetching donation:', error);
      res.status(500).json({ 
        error: 'Failed to fetch donation',
        message: error.message 
      });
    }
  },

  // Update donation status (Admin only)
  updateDonation: async (req, res) => {
    try {
      const { donationId, status, notes } = req.body;
      
      const updatedDonation = await CompassionDonation.findByIdAndUpdate(
        donationId,
        { 
          status, 
          notes,
          lastUpdated: new Date()
        },
        { new: true }
      );

      if (!updatedDonation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      console.log('Donation updated:', {
        id: updatedDonation._id,
        status: updatedDonation.status
      });

      res.json({
        message: 'Donation updated successfully',
        donation: updatedDonation
      });
    } catch (error) {
      console.error('Error updating donation:', error);
      res.status(500).json({ 
        error: 'Failed to update donation',
        message: error.message 
      });
    }
  },

  // Delete donation (Admin only)
  deleteDonation: async (req, res) => {
    try {
      const deletedDonation = await CompassionDonation.findByIdAndDelete(req.params.id);
      if (!deletedDonation) {
        return res.status(404).json({ error: 'Donation not found' });
      }
      
      console.log('Donation deleted:', deletedDonation._id);
      res.json({ message: 'Donation deleted successfully' });
    } catch (error) {
      console.error('Error deleting donation:', error);
      res.status(500).json({ 
        error: 'Failed to delete donation',
        message: error.message 
      });
    }
  },

  // ===== ANALYTICS & REPORTS =====

  // Get dashboard statistics (Admin only)
  getDashboardStats: async (req, res) => {
    try {
      const [
        totalRequests,
        totalDonations,
        pendingRequests,
        urgentRequests,
        monetaryDonations,
        totalDonationAmount
      ] = await Promise.all([
        CompassionRequest.countDocuments(),
        CompassionDonation.countDocuments(),
        CompassionRequest.countDocuments({ status: 'pending' }),
        CompassionRequest.countDocuments({ urgency: { $in: ['high', 'emergency'] } }),
        CompassionDonation.countDocuments({ donationType: 'monetary' }),
        CompassionDonation.aggregate([
          { $match: { donationType: 'monetary', amount: { $exists: true } } },
          { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ])
      ]);

      const stats = {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          urgent: urgentRequests
        },
        donations: {
          total: totalDonations,
          monetary: monetaryDonations,
          totalAmount: totalDonationAmount[0]?.total || 0
        }
      };

      res.json({
        message: 'Dashboard statistics retrieved successfully',
        stats: stats
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard statistics',
        message: error.message 
      });
    }
  },

  // ===== SETTINGS MANAGEMENT =====

  // Get payment methods and contact info (Public)
  getSettings: async (req, res) => {
    try {
      const settings = await CompassionSettings.getSettings();
      
      // Filter only active items for public display
      const publicSettings = {
        paymentMethods: settings.paymentMethods.filter(method => method.isActive),
        contactInfo: settings.contactInfo
          .filter(contact => contact.isActive)
          .sort((a, b) => a.priority - b.priority)
      };

      res.json({
        message: 'Settings retrieved successfully',
        settings: publicSettings
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ 
        error: 'Failed to fetch settings',
        message: error.message 
      });
    }
  },

  // Get all settings including inactive (Admin only)
  getAllSettings: async (req, res) => {
    try {
      const settings = await CompassionSettings.getSettings();
      
      res.json({
        message: 'All settings retrieved successfully',
        settings: settings
      });
    } catch (error) {
      console.error('Error fetching all settings:', error);
      res.status(500).json({ 
        error: 'Failed to fetch settings',
        message: error.message 
      });
    }
  },

  // Update payment methods (Admin only)
  updatePaymentMethods: async (req, res) => {
    try {
      const { paymentMethods } = req.body;
      
      const settings = await CompassionSettings.getSettings();
      settings.paymentMethods = paymentMethods;
      settings.lastUpdated = new Date();
      settings.updatedBy = 'Admin'; // Could be enhanced with actual admin info
      
      await settings.save();

      console.log('Payment methods updated:', paymentMethods.length, 'methods');

      res.json({
        message: 'Payment methods updated successfully',
        paymentMethods: settings.paymentMethods
      });
    } catch (error) {
      console.error('Error updating payment methods:', error);
      res.status(500).json({ 
        error: 'Failed to update payment methods',
        message: error.message 
      });
    }
  },

  // Update contact information (Admin only)
  updateContactInfo: async (req, res) => {
    try {
      const { contactInfo } = req.body;
      
      const settings = await CompassionSettings.getSettings();
      settings.contactInfo = contactInfo;
      settings.lastUpdated = new Date();
      settings.updatedBy = 'Admin'; // Could be enhanced with actual admin info
      
      await settings.save();

      console.log('Contact info updated:', contactInfo.length, 'contacts');

      res.json({
        message: 'Contact information updated successfully',
        contactInfo: settings.contactInfo
      });
    } catch (error) {
      console.error('Error updating contact info:', error);
      res.status(500).json({ 
        error: 'Failed to update contact information',
        message: error.message 
      });
    }
  },

  // Add new payment method (Admin only)
  addPaymentMethod: async (req, res) => {
    try {
      const { name, type, details } = req.body;
      
      const settings = await CompassionSettings.getSettings();
      const newMethod = {
        name,
        type,
        details,
        isActive: true
      };
      
      settings.paymentMethods.push(newMethod);
      settings.lastUpdated = new Date();
      settings.updatedBy = 'Admin';
      
      await settings.save();

      console.log('New payment method added:', name);

      res.json({
        message: 'Payment method added successfully',
        paymentMethod: newMethod
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
      res.status(500).json({ 
        error: 'Failed to add payment method',
        message: error.message 
      });
    }
  },

  // Add new contact info (Admin only)
  addContactInfo: async (req, res) => {
    try {
      const { type, title, value, description, priority } = req.body;
      
      const settings = await CompassionSettings.getSettings();
      const newContact = {
        type,
        title,
        value,
        description,
        priority: priority || 0,
        isActive: true
      };
      
      settings.contactInfo.push(newContact);
      settings.lastUpdated = new Date();
      settings.updatedBy = 'Admin';
      
      await settings.save();

      console.log('New contact info added:', title);

      res.json({
        message: 'Contact information added successfully',
        contactInfo: newContact
      });
    } catch (error) {
      console.error('Error adding contact info:', error);
      res.status(500).json({ 
        error: 'Failed to add contact information',
        message: error.message 
      });
    }
  }
};

module.exports = compassionController;