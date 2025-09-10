const authenticateAdmin = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== 'Overseer') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin authentication required' 
    });
  }
  
  next();
};

module.exports = { authenticateAdmin };