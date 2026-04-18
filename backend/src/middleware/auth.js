const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or account deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore errors for optional auth (e.g. expired token)
  }
  next();
};

const requireRegisteredUser = (req, res, next) => {
  if (req.user && req.user.is_guest) {
    return res.status(403).json({ error: 'Please create an account to access this feature.' });
  }
  next();
};


// Middleware to verify IoT device API key (for sensor POSTs)
const deviceAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  // For demo: accept any non-empty key starting with "AGD-"
  // In production: store device keys in DB and validate against them
  if (!apiKey || !apiKey.startsWith('AGD-')) {
    return res.status(401).json({ error: 'Invalid device API key' });
  }

  req.device_id = apiKey;
  next();
};

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { protect, deviceAuth, signToken, optionalProtect, requireRegisteredUser };
