const express = require('express');
const router = express.Router();
const requisitionController = require('../controllers/requisitionController');

// Get all requisitions
router.get('/requisitions', requisitionController.getAllRequisitions);

// Get single requisition
router.get('/requisitions/:id', requisitionController.getRequisition);

// Create new requisition
router.post('/requisitions', requisitionController.createRequisition);

// Update requisition
router.put('/requisitions/:id', requisitionController.updateRequisition);

// Update requisition status
router.patch('/requisitions/:id/status', requisitionController.updateStatus);

module.exports = router;