const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens for web users
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user and attach to request
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        error: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    console.error('Token authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({ 
      message: 'Token verification failed',
      error: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

/**
 * Middleware to authenticate device API keys for IoT devices
 */
const authenticateDevice = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ 
        message: 'API key required',
        error: 'NO_API_KEY'
      });
    }

    // Find user by device API key
    const user = await User.findByDeviceApiKey(apiKey);
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid API key',
        error: 'INVALID_API_KEY'
      });
    }

    // Update API key last used timestamp (async, don't wait)
    user.updateApiKeyUsage().catch(err => {
      console.error('Error updating API key usage:', err);
    });

    req.user = user;
    req.userId = user._id;
    req.deviceApiKey = apiKey;
    next();
  } catch (error) {
    console.error('Device authentication error:', error);
    return res.status(500).json({ 
      message: 'Device authentication failed',
      error: 'DEVICE_AUTH_FAILED'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'NO_USER'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ 
      message: 'Authorization check failed',
      error: 'AUTHORIZATION_FAILED'
    });
  }
};

module.exports = {
  authenticateToken,
  authenticateDevice,
  isAdmin
};