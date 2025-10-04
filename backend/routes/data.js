const express = require('express');
const AirQualityData = require('../models/AirQualityData');
const { authenticateDevice, authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/data
 * @desc    Submit air quality data from IoT device
 * @access  Private (Device API Key)
 */
router.post('/', authenticateDevice, async (req, res) => {
  try {
    const {
      deviceId,
      pm25,
      pm10,
      temperature,
      humidity,
      co2,
      voc,
      aqi,
      location,
      batteryLevel,
      signalStrength
    } = req.body;

    // Validate required fields
    const requiredFields = ['deviceId', 'pm25', 'pm10', 'temperature', 'humidity', 'co2', 'voc', 'aqi'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields: missingFields,
        error: 'MISSING_FIELDS'
      });
    }

    // Validate numeric values
    const numericFields = ['pm25', 'pm10', 'temperature', 'humidity', 'co2', 'voc', 'aqi'];
    for (const field of numericFields) {
      if (isNaN(req.body[field]) || !isFinite(req.body[field])) {
        return res.status(400).json({
          message: `${field} must be a valid number`,
          error: 'INVALID_NUMBER'
        });
      }
    }

    // Create new air quality data entry
    const airQualityData = new AirQualityData({
      owner: req.userId,
      deviceId: deviceId.trim(),
      pm25: Number(pm25),
      pm10: Number(pm10),
      temperature: Number(temperature),
      humidity: Number(humidity),
      co2: Number(co2),
      voc: Number(voc),
      aqi: Number(aqi),
      location: location || undefined,
      batteryLevel: batteryLevel ? Number(batteryLevel) : undefined,
      signalStrength: signalStrength ? Number(signalStrength) : undefined
    });

    // Save to database
    await airQualityData.save();

    // Return success response
    res.status(201).json({
      message: 'Air quality data saved successfully',
      data: {
        id: airQualityData._id,
        deviceId: airQualityData.deviceId,
        aqi: airQualityData.aqi,
        airQualityCategory: airQualityData.airQualityCategory,
        timestamp: airQualityData.timestamp
      }
    });

  } catch (error) {
    console.error('Data submission error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: 'Data validation failed',
        errors: errors,
        error: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      message: 'Failed to save air quality data',
      error: 'DATA_SAVE_ERROR'
    });
  }
});

/**
 * @route   GET /api/data
 * @desc    Get user's air quality data
 * @access  Private (JWT)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      limit = 100, 
      page = 1, 
      deviceId, 
      startDate, 
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { owner: req.userId };
    
    if (deviceId) {
      query.deviceId = deviceId;
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
    const limitNum = Math.min(parseInt(limit), 1000); // Max 1000 records per request
    const skip = (parseInt(page) - 1) * limitNum;

    const [data, total] = await Promise.all([
      AirQualityData.find(query)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      AirQualityData.countDocuments(query)
    ]);

    // Get additional statistics
    const stats = await AirQualityData.getAverageReadings(req.userId, 24);

    res.json({
      message: 'Air quality data retrieved successfully',
      data: data,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      statistics: stats[0] || null
    });

  } catch (error) {
    console.error('Data retrieval error:', error);
    res.status(500).json({
      message: 'Failed to retrieve air quality data',
      error: 'DATA_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @route   GET /api/data/latest
 * @desc    Get latest air quality reading for user
 * @access  Private (JWT)
 */
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const { deviceId, userId } = req.query;

    // Allow admins to fetch data for other users
    const targetUserId = userId && req.userRole === 'admin' ? userId : req.userId;

    let latestData;
    if (deviceId) {
      latestData = await AirQualityData.getLatestByDevice(deviceId);
      // Verify ownership (skip for admins fetching other users' data)
      if (latestData && !latestData.owner.equals(targetUserId) && !(userId && req.userRole === 'admin')) {
        return res.status(403).json({
          message: 'Access denied to this device data',
          error: 'ACCESS_DENIED'
        });
      }
    } else {
      latestData = await AirQualityData.getLatestByOwner(targetUserId);
    }

    if (!latestData) {
      return res.status(404).json({
        message: 'No air quality data found',
        error: 'NO_DATA_FOUND'
      });
    }

    res.json({
      message: 'Latest air quality data retrieved successfully',
      data: latestData
    });

  } catch (error) {
    console.error('Latest data retrieval error:', error);
    res.status(500).json({
      message: 'Failed to retrieve latest air quality data',
      error: 'LATEST_DATA_ERROR'
    });
  }
});

/**
 * @route   GET /api/data/charts
 * @desc    Get air quality data formatted for charts
 * @access  Private (JWT)
 */
router.get('/charts', authenticateToken, async (req, res) => {
  try {
    const { hours = 24, type = 'hourly', userId } = req.query;
    
    // Allow admins to fetch data for other users
    const targetUserId = userId && req.userRole === 'admin' ? userId : req.userId;
    
    const hoursNum = Math.min(parseInt(hours), 168); // Max 7 days

    let chartData;
    if (type === 'hourly') {
      chartData = await AirQualityData.getHourlyAverages(targetUserId, hoursNum);
    } else {
      // Default to recent readings
      const startDate = new Date(Date.now() - hoursNum * 60 * 60 * 1000);
      chartData = await AirQualityData.getReadingsInRange(targetUserId, startDate, new Date(), 100);
    }

    res.json({
      message: 'Chart data retrieved successfully',
      data: chartData,
      type: type,
      timeRange: `${hoursNum} hours`
    });

  } catch (error) {
    console.error('Chart data retrieval error:', error);
    res.status(500).json({
      message: 'Failed to retrieve chart data',
      error: 'CHART_DATA_ERROR'
    });
  }
});

/**
 * @route   GET /api/data/alerts
 * @desc    Get air quality alerts (high AQI readings)
 * @access  Private (JWT)
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { threshold = 150, hours = 24, userId } = req.query;
    
    // Allow admins to fetch data for other users
    const targetUserId = userId && req.userRole === 'admin' ? userId : req.userId;
    
    const alertReadings = await AirQualityData.getAlertReadings(
      targetUserId, 
      parseInt(threshold), 
      parseInt(hours)
    );

    res.json({
      message: 'Alert data retrieved successfully',
      alerts: alertReadings,
      threshold: parseInt(threshold),
      timeRange: `${hours} hours`,
      count: alertReadings.length
    });

  } catch (error) {
    console.error('Alert data retrieval error:', error);
    res.status(500).json({
      message: 'Failed to retrieve alert data',
      error: 'ALERT_DATA_ERROR'
    });
  }
});

module.exports = router;