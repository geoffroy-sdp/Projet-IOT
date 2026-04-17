const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

const adminKeyMiddleware = (req, res, next) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const envAdminKey = process.env.ADMIN_KEY;

    if (!adminKey || !envAdminKey) {
      return res.status(401).json({
        success: false,
        message: 'Admin key is required',
      });
    }

    if (adminKey !== envAdminKey) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin key',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Admin key validation failed',
      error: error.message,
    });
  }
};

const generateToken = (userId, isAdmin = false, expiresIn = '24h') => {
  return jwt.sign(
    { userId, isAdmin },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    { expiresIn: '7d' }
  );
};

module.exports = {
  authMiddleware,
  adminKeyMiddleware,
  generateToken,
  generateRefreshToken,
};
