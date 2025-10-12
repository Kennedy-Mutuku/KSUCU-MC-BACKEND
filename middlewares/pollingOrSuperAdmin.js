const jwt = require('jsonwebtoken');
const PollingOfficer = require('../models/pollingOfficer');
const SuperAdmin = require('../models/superAdmin');

// Middleware that allows both super admin and polling officer access
module.exports = async (req, res, next) => {
    try {
        console.log('🔐 pollingOrSuperAdmin middleware: checking authentication');
        console.log('🔐 Cookies received:', Object.keys(req.cookies));

        // Check for super admin token first
        const sadminToken = req.cookies.sadmin_token;
        console.log('🔐 Super admin token present:', !!sadminToken);
        if (sadminToken) {
            try {
                console.log('🔐 Verifying super admin token...');
                const sadminSecretKey = process.env.JWT_ADMIN_SECRET || 'your-secret-key';
                console.log('🔐 Using secret key:', sadminSecretKey ? `${sadminSecretKey.substring(0, 5)}...` : 'undefined');
                console.log('🔐 JWT_ADMIN_SECRET from env:', process.env.JWT_ADMIN_SECRET ? 'present' : 'missing');
                const decoded = jwt.verify(sadminToken, sadminSecretKey);
                console.log('🔐 Token decoded, userId:', decoded.userId);
                const superAdmin = await SuperAdmin.findById(decoded.userId);
                console.log('🔐 SuperAdmin found:', !!superAdmin);

                if (superAdmin) {
                    req.userId = decoded.userId;
                    req.userRole = 'superadmin';
                    console.log('🔐 Super admin authenticated successfully, calling next()');
                    return next();
                } else {
                    console.log('🔐 SuperAdmin not found in database');
                }
            } catch (err) {
                console.log('🔐 Error verifying super admin token:', err.message);
                // Token invalid, continue to check polling officer token
            }
        }

        // Check for polling officer token
        const pollingToken = req.cookies.polling_officer_token;
        if (pollingToken) {
            try {
                const pollingSecretKey = process.env.JWT_ADMIN_SECRET || 'your-secret-key';
                const decoded = jwt.verify(pollingToken, pollingSecretKey);
                const officer = await PollingOfficer.findById(decoded.userId);

                if (!officer) {
                    return res.status(401).json({ message: 'Authentication failed: Officer not found.' });
                }

                if (officer.status !== 'active') {
                    return res.status(403).json({ message: 'Your account has been suspended' });
                }

                req.userId = decoded.userId;
                req.userRole = 'pollingofficer';
                return next();
            } catch (err) {
                return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
            }
        }

        // No valid token found
        return res.status(401).json({ message: 'Authentication failed: No token provided.' });
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
