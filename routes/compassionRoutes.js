const express = require('express');
const router = express.Router();
const compassionController = require('../controllers/compassionController');

// ===== PUBLIC ROUTES (User-facing) =====

// Help Request Routes
router.post('/help-request', compassionController.createHelpRequest);

// Donation Routes  
router.post('/donation', compassionController.createDonation);

// ===== ADMIN ROUTES =====

// Help Request Admin Routes
router.get('/admin/help-requests', compassionController.getAllHelpRequests);
router.get('/admin/help-request/:id', compassionController.getHelpRequest);
router.put('/admin/help-request', compassionController.updateHelpRequest);
router.delete('/admin/help-request/:id', compassionController.deleteHelpRequest);

// Donation Admin Routes
router.get('/admin/donations', compassionController.getAllDonations);
router.get('/admin/donation/:id', compassionController.getDonation);
router.put('/admin/donation', compassionController.updateDonation);
router.delete('/admin/donation/:id', compassionController.deleteDonation);

// Dashboard Statistics
router.get('/admin/stats', compassionController.getDashboardStats);

module.exports = router;