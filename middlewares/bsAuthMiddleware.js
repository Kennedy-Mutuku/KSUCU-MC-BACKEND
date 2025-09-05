const jwt = require('jsonwebtoken');
const pkg = require('jsonwebtoken');
const { verify } = pkg;

const secretKey = process.env.JWT_USER_SECRET;

module.exports = (req, res, next) => {
  // Check for development environment bypass
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
  const isLocalhost = req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'));
  
  // Allow bypass for development/localhost
  if (isDevelopment && isLocalhost) {
    console.log('Development mode: Bypassing BS auth middleware');
    req.userId = 'dev-user-id'; // Fake user ID for development
    return next();
  }

  const token = req.cookies.bs_token;
  
  if (!token) {
    console.log('no token provided');
    return res.status(401).json({ 
      message: 'Authentication failed: No token provided.',
      hint: 'Please login through the Bible Study admin panel first.'
    });
  }

  verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ 
        message: `Authentication failed: ${err.message}`,
        hint: 'Your session may have expired. Please login again.'
      });
    }
    
    req.userId = decoded.userId;
    console.log('BS auth successful for user:', req.userId);
    next();
  });
};
