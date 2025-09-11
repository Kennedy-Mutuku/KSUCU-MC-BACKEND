const Requisition = require('../models/requisition');

const requisitionController = {
  // Get all requisitions
  getAllRequisitions: async (req, res) => {
    try {
      const requisitions = await Requisition.find().sort({ submittedAt: -1 });
      res.json(requisitions);
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      res.status(500).json({ error: 'Failed to fetch requisitions' });
    }
  },

  // Get single requisition
  getRequisition: async (req, res) => {
    try {
      const requisition = await Requisition.findById(req.params.id);
      if (!requisition) {
        return res.status(404).json({ error: 'Requisition not found' });
      }
      res.json(requisition);
    } catch (error) {
      console.error('Error fetching requisition:', error);
      res.status(500).json({ error: 'Failed to fetch requisition' });
    }
  },

  // Create new requisition
  createRequisition: async (req, res) => {
    try {
      const newRequisition = new Requisition(req.body);
      const savedRequisition = await newRequisition.save();
      res.status(201).json(savedRequisition);
    } catch (error) {
      console.error('Error creating requisition:', error);
      res.status(500).json({ error: 'Failed to create requisition' });
    }
  },

  // Update requisition
  updateRequisition: async (req, res) => {
    try {
      const updatedRequisition = await Requisition.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedRequisition) {
        return res.status(404).json({ error: 'Requisition not found' });
      }
      res.json(updatedRequisition);
    } catch (error) {
      console.error('Error updating requisition:', error);
      res.status(500).json({ error: 'Failed to update requisition' });
    }
  },

  // Update requisition status
  updateStatus: async (req, res) => {
    try {
      const { status, releasedBy, comments } = req.body;
      const updateData = { status };
      
      if (status === 'released' && releasedBy) {
        updateData.releasedBy = releasedBy;
        updateData.releasedAt = new Date();
      }
      
      if (status === 'returned') {
        updateData.returnedAt = new Date();
      }
      
      if (comments) {
        updateData.comments = comments;
      }

      const updatedRequisition = await Requisition.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedRequisition) {
        return res.status(404).json({ error: 'Requisition not found' });
      }

      res.json(updatedRequisition);
    } catch (error) {
      console.error('Error updating requisition status:', error);
      res.status(500).json({ error: 'Failed to update requisition status' });
    }
  }
};

module.exports = requisitionController;