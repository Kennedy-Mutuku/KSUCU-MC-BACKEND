const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userAuthMiddleware = require('../middlewares/userAuthMiddleware')

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/verify-email', userController.verifyEmail);
router.post('/save-soul', userAuthMiddleware, userController.saveSoul);
router.post('/bibleStudy', userController.bibleStudy);
router.get('/countSaved', userController.countSaved);
router.get('/data', userAuthMiddleware, userController.getUserData);
router.put('/update', userAuthMiddleware, userController.updateUserData);
router.post('/logout', userAuthMiddleware, userController.logout)
router.post('/forget-password', userController.forgetPassword);
router.post('/reset-password', userController.resetPassword)

module.exports = router;

