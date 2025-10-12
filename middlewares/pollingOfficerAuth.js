const jwt = require('jsonwebtoken');
const PollingOfficer = require('../models/pollingOfficer');

const secretKey = process.env.JWT_ADMIN_SECRET;

module.exports = async (req, res, next) => {
  const token = req.cookies.polling_officer_token;

  if (!token) {
    console.log('No polling officer token provided');
    return res.status(401).json({ message: 'Authentication failed: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);

    // Check if officer exists and is active
    const officer = await PollingOfficer.findById(decoded.userId);

    if (!officer) {
      return res.status(403).json({ message: 'Polling officer not found' });
    }

    if (officer.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    if (officer.status === 'deleted') {
      return res.status(403).json({ message: 'Your account has been deleted' });
    }

    req.userId = decoded.userId;
    req.officerRole = decoded.role;
    next();
  } catch (err) {
    return res.status(403).json({ message: `Authentication failed: ${err.message}` });
  }
};
