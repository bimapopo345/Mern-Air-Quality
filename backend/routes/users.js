const express = require('express');
const User = require('../models/User');
const AirQualityData = require('../models/AirQualityData');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private (JWT)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Get user's data statistics
    const dataStats = await AirQualityData.aggregate([
      { $match: { owner: req.userId } },
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          latestReading: { $max: '$timestamp' },
          avgAQI: { $avg: '$aqi' },
          devicesCount: { $addToSet: '$deviceId' }
        }
      }
    ]);

    const stats = dataStats[0] || {
      totalReadings: 0,
      latestReading: null,
      avgAQI: null,
      devicesCount: []
    };

    res.json({
      message: 'User profile retrieved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        deviceApiKeyStatus: user.deviceApiKeyStatus,
        deviceApiKeyLastUsed: user.deviceApiKeyLastUsed,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        statistics: {
          totalReadings: stats.totalReadings,
          latestReading: stats.latestReading,
          averageAQI: stats.avgAQI ? Math.round(stats.avgAQI * 100) / 100 : null,
          connectedDevices: stats.devicesCount.length
        }
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      message: 'Failed to retrieve user profile',
      error: 'PROFILE_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private (JWT)
 */
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    // Validate and prepare updates
    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          message: 'Name must be at least 2 characters',
          error: 'INVALID_NAME'
        });
      }
      updates.name = name.trim();
    }

    if (email) {
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({
          message: 'Please enter a valid email',
          error: 'INVALID_EMAIL'
        });
      }
      
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          message: 'Email already taken',
          error: 'EMAIL_TAKEN'
        });
      }
      
      updates.email = email.toLowerCase().trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid updates provided',
        error: 'NO_UPDATES'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors,
        error: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      message: 'Failed to update profile',
      error: 'PROFILE_UPDATE_ERROR'
    });
  }
});

/**
 * @route   GET /api/users/me/api-key
 * @desc    Get current user's device API key (masked)
 * @access  Private (JWT)
 */
router.get('/me/api-key', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Mask the API key for security
    const maskedKey = user.deviceApiKey.substring(0, 8) + 
                     '*'.repeat(user.deviceApiKey.length - 12) + 
                     user.deviceApiKey.substring(user.deviceApiKey.length - 4);

    res.json({
      message: 'API key retrieved successfully',
      apiKey: {
        masked: maskedKey,
        lastUsed: user.deviceApiKeyLastUsed,
        status: user.deviceApiKeyStatus,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({
      message: 'Failed to retrieve API key',
      error: 'API_KEY_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @route   POST /api/users/me/api-key/reveal
 * @desc    Reveal current user's full device API key
 * @access  Private (JWT)
 */
router.post('/me/api-key/reveal', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'API key revealed successfully',
      apiKey: user.deviceApiKey,
      warning: 'Keep this key secure and do not share it'
    });

  } catch (error) {
    console.error('Reveal API key error:', error);
    res.status(500).json({
      message: 'Failed to reveal API key',
      error: 'API_KEY_REVEAL_ERROR'
    });
  }
});

/**
 * @route   POST /api/users/me/api-key/regenerate
 * @desc    Regenerate current user's device API key
 * @access  Private (JWT)
 */
router.post('/me/api-key/regenerate', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Regenerate API key
    const newApiKey = await user.regenerateDeviceApiKey();

    res.json({
      message: 'API key regenerated successfully',
      newApiKey: newApiKey,
      warning: 'Your old API key is now invalid. Update your devices with the new key.'
    });

  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      message: 'Failed to regenerate API key',
      error: 'API_KEY_REGENERATION_ERROR'
    });
  }
});

/**
 * @route   GET /api/users/me/devices
 * @desc    Get list of user's connected devices
 * @access  Private (JWT)
 */
router.get('/me/devices', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Allow admins to fetch devices for other users
    const targetUserId = userId && req.userRole === 'admin' ? userId : req.userId;
    
    // Get unique devices with their latest data
    const devices = await AirQualityData.aggregate([
      { $match: { owner: targetUserId } },
      {
        $group: {
          _id: '$deviceId',
          latestReading: { $max: '$timestamp' },
          totalReadings: { $sum: 1 },
          avgAQI: { $avg: '$aqi' },
          lastBatteryLevel: { $last: '$batteryLevel' },
          lastSignalStrength: { $last: '$signalStrength' },
          location: { $last: '$location' }
        }
      },
      {
        $project: {
          deviceId: '$_id',
          latestReading: 1,
          totalReadings: 1,
          avgAQI: { $round: ['$avgAQI', 1] },
          lastBatteryLevel: 1,
          lastSignalStrength: 1,
          location: 1,
          status: {
            $cond: {
              if: { $gt: ['$latestReading', new Date(Date.now() - 60 * 60 * 1000)] },
              then: 'online',
              else: {
                $cond: {
                  if: { $gt: ['$latestReading', new Date(Date.now() - 24 * 60 * 60 * 1000)] },
                  then: 'recently_active',
                  else: 'offline'
                }
              }
            }
          }
        }
      },
      { $sort: { latestReading: -1 } }
    ]);

    res.json({
      message: 'Devices retrieved successfully',
      devices: devices,
      count: devices.length
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      message: 'Failed to retrieve devices',
      error: 'DEVICES_RETRIEVAL_ERROR'
    });
  }
});

module.exports = router;