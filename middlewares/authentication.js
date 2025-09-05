const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_USER_SECRET;

module.exports = (req, res, next) => {
  const token = req.cookies.user_s;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication failed: No token provided.' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: `Authentication failed: ${err.message}` });
    }
    
    req.user = { userId: decoded.userId };
    next();
  });
};