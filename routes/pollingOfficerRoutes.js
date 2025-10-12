const express = require('express');
const router = express.Router();
const pollingOfficerController = require('../controllers/pollingOfficerController');
const pollingOfficerAuth = require('../middlewares/pollingOfficerAuth');
const superAdminAuth = require('../middlewares/superAdmin');
const pollingOrSuperAdmin = require('../middlewares/pollingOrSuperAdmin');
// Updated middleware

// Public routes
router.post('/login', pollingOfficerController.login);

// Polling officer authenticated routes
router.post('/logout', pollingOfficerAuth, pollingOfficerController.logout);
router.get('/profile', pollingOfficerAuth, pollingOfficerController.getProfile);
router.get('/unvoted-users', pollingOfficerAuth, pollingOfficerController.getUnvotedUsers);
router.post('/mark-voted/:userId', pollingOfficerAuth, pollingOfficerController.markAsVoted);
router.post('/register-and-vote', pollingOfficerAuth, pollingOfficerController.registerAndVoteUser);
router.get('/search-user', pollingOfficerAuth, pollingOfficerController.searchUser);

// Routes accessible by both super admin and polling officer
router.get('/stats', pollingOrSuperAdmin, pollingOfficerController.getPollingStats);

// Super admin only routes
router.post('/create', superAdminAuth, pollingOfficerController.createOfficer);
router.get('/list', superAdminAuth, pollingOfficerController.getAllOfficers);
router.put('/status/:id', superAdminAuth, pollingOfficerController.updateOfficerStatus);
router.get('/voted-users', superAdminAuth, pollingOfficerController.getAllVotedUsers);

module.exports = router;
