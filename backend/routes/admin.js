const express = require('express');
const User = require('../models/User');
const AirQualityData = require('../models/AirQualityData');
const ApiLog = require('../models/ApiLog');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(isAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.getUserStats();
    
    // Get data statistics
    const dataStats = await AirQualityData.aggregate([
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          avgAQI: { $avg: '$aqi' },
          latestReading: { $max: '$timestamp' },
          uniqueDevices: { $addToSet: '$deviceId' }
        }
      }
    ]);

    // Get recent API logs statistics
    const apiStats = await ApiLog.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          errorRequests: {
            $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
          },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    // Get hourly request distribution for the last 24 hours
    const hourlyStats = await ApiLog.getHourlyDistribution(1);

    const dashboard = {
      users: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        usersWithApiKeyUsage: 0
      },
      data: dataStats[0] || {
        totalReadings: 0,
        avgAQI: null,
        latestReading: null,
        uniqueDevices: []
      },
      api: apiStats[0] || {
        totalRequests: 0,
        errorRequests: 0,
        avgResponseTime: null
      },
      hourlyActivity: hourlyStats
    };

    // Calculate additional metrics
    dashboard.data.uniqueDevicesCount = dashboard.data.uniqueDevices?.length || 0;
    delete dashboard.data.uniqueDevices;

    dashboard.api.errorRate = dashboard.api.totalRequests > 0 
      ? ((dashboard.api.errorRequests / dashboard.api.totalRequests) * 100).toFixed(2)
      : 0;

    res.json({
      message: 'Admin dashboard data retrieved successfully',
      dashboard: dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      message: 'Failed to retrieve dashboard data',
      error: 'DASHBOARD_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Private (Admin)
 */
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query) // Include all user fields
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      User.countDocuments(query)
    ]);

    // Get additional user data (device usage, etc.)
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const dataStats = await AirQualityData.aggregate([
          { $match: { owner: user._id } },
          {
            $group: {
              _id: null,
              totalReadings: { $sum: 1 },
              latestReading: { $max: '$timestamp' },
              uniqueDevices: { $addToSet: '$deviceId' }
            }
          }
        ]);

        return {
          ...user,
          statistics: dataStats[0] ? {
            totalReadings: dataStats[0].totalReadings,
            latestReading: dataStats[0].latestReading,
            uniqueDevices: dataStats[0].uniqueDevices.length
          } : {
            totalReadings: 0,
            latestReading: null,
            uniqueDevices: 0
          }
        };
      })
    );

    res.json({
      message: 'Users retrieved successfully',
      users: usersWithStats,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to retrieve users',
      error: 'USERS_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (admin can change role, activate/deactivate)
 * @access  Private (Admin)
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.userId.toString() === id && isActive === false) {
      return res.status(400).json({
        message: 'Cannot deactivate your own account',
        error: 'SELF_DEACTIVATION'
      });
    }

    // Prepare updates
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role && ['user', 'admin'].includes(role)) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors,
        error: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      message: 'Failed to update user',
      error: 'USER_UPDATE_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete - deactivate)
 * @access  Private (Admin)
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.userId.toString() === id) {
      return res.status(400).json({
        message: 'Cannot delete your own account',
        error: 'SELF_DELETION'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Soft delete (deactivate)
    await user.deactivate();

    res.json({
      message: 'User deactivated successfully',
      userId: id
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Failed to delete user',
      error: 'USER_DELETION_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/logs
 * @desc    Get API logs with filtering
 * @access  Private (Admin)
 */
router.get('/logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      method = '',
      statusCode = '',
      hours = 24,
      endpoint = ''
    } = req.query;

    // Build query
    const query = {};
    
    if (hours) {
      const startDate = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
      query.timestamp = { $gte: startDate };
    }
    
    if (method) query.method = method.toUpperCase();
    if (statusCode) query.statusCode = parseInt(statusCode);
    if (endpoint) query.endpoint = { $regex: endpoint, $options: 'i' };

    // Execute query with pagination
    const limitNum = Math.min(parseInt(limit), 200);
    const skip = (parseInt(page) - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ApiLog.find(query)
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .skip(skip)
        .lean(),
      ApiLog.countDocuments(query)
    ]);

    res.json({
      message: 'API logs retrieved successfully',
      logs: logs,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      message: 'Failed to retrieve logs',
      error: 'LOGS_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/logs/stats
 * @desc    Get API usage statistics
 * @access  Private (Admin)
 */
router.get('/logs/stats', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    
    const [usageStats, errorLogs] = await Promise.all([
      ApiLog.getUsageStats(parseInt(hours)),
      ApiLog.getErrorLogs(parseInt(hours), 10)
    ]);

    res.json({
      message: 'API statistics retrieved successfully',
      timeRange: `${hours} hours`,
      usageStats: usageStats,
      recentErrors: errorLogs
    });

  } catch (error) {
    console.error('Get log stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve log statistics',
      error: 'LOG_STATS_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/data/all
 * @desc    Get all air quality data from database with filtering
 * @access  Private (Admin)
 */
router.get('/data/all', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      user_id = '', 
      deviceId = '', 
      startDate = '', 
      endDate = '',
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (user_id) {
      try {
        console.log('Filtering by user_id:', user_id);
        query.owner = new mongoose.Types.ObjectId(user_id);
        console.log('ObjectId filter applied');
      } catch (error) {
        console.log('Invalid ObjectId format, using string comparison');
        query.owner = user_id;
      }
    }
    
    if (deviceId) {
      query.deviceId = { $regex: deviceId, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const limitNum = Math.min(parseInt(limit), 1000);
    const skip = (parseInt(page) - 1) * limitNum;

    const [data, total] = await Promise.all([
      AirQualityData.find(query)
        .populate('owner', 'name email role')
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      AirQualityData.countDocuments(query)
    ]);

    // Get overall statistics
    const statsPipeline = [];
    
    if (userId) {
      statsPipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } });
    }
    
    statsPipeline.push({
      $group: {
        _id: null,
        totalReadings: { $sum: 1 },
        avgAQI: { $avg: '$aqi' },
        avgPM25: { $avg: '$pm25' },
        avgPM10: { $avg: '$pm10' },
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgCO2: { $avg: '$co2' },
        avgVOC: { $avg: '$voc' },
        maxAQI: { $max: '$aqi' },
        minAQI: { $min: '$aqi' },
        uniqueDevices: { $addToSet: '$deviceId' },
        uniqueUsers: { $addToSet: '$owner' }
      }
    });

    // Skip statistics for now to focus on main functionality
    const stats = [{}];

    res.json({
      message: 'All air quality data retrieved successfully',
      data: data,
      statistics: stats[0] || {
        totalReadings: 0,
        avgAQI: 0,
        uniqueDevices: [],
        uniqueUsers: []
      },
      pagination: {
        total: total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get all data error:', error);
    res.status(500).json({
      message: 'Failed to retrieve air quality data',
      error: 'ALL_DATA_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/admin/data/all
 * @desc    Delete all air quality data (for testing/reset purposes)
 * @access  Private (Admin)
 */
router.delete('/data/all', async (req, res) => {
  try {
    // This is a powerful operation, ensure it's only for admin/testing
    const result = await AirQualityData.deleteMany({});
    console.log(`Deleted ${result.deletedCount} air quality data entries.`);
    
    res.json({
      message: `Successfully deleted ${result.deletedCount} air quality data entries.`,
      count: result.deletedCount
    });

  } catch (error) {
    console.error('Delete all data error:', error);
    res.status(500).json({
      message: 'Failed to delete data',
      error: 'DATA_DELETION_ERROR'
    });
  }
});

module.exports = router;