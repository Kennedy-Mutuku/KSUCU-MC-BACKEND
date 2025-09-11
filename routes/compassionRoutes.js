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

// ===== SETTINGS ROUTES =====

// Public Settings (Payment Methods & Contact Info)
router.get('/settings', compassionController.getSettings);

// Admin Settings Routes
router.get('/admin/settings', compassionController.getAllSettings);
router.put('/admin/settings/payment-methods', compassionController.updatePaymentMethods);
router.put('/admin/settings/contact-info', compassionController.updateContactInfo);
router.post('/admin/settings/payment-method', compassionController.addPaymentMethod);
router.post('/admin/settings/contact-info', compassionController.addContactInfo);

module.exports = router;