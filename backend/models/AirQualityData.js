const mongoose = require('mongoose');

const airQualityDataSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
    index: true
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    trim: true,
    maxlength: [50, 'Device ID cannot exceed 50 characters'],
    index: true
  },
  // Core Air Quality Sensor Data
  pm25: {
    type: Number,
    required: [true, 'PM2.5 reading is required'],
    min: [0, 'PM2.5 cannot be negative'],
    max: [1000, 'PM2.5 reading seems unusually high'],
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'PM2.5 must be a valid number'
    }
  },
  pm10: {
    type: Number,
    required: [true, 'PM10 reading is required'],
    min: [0, 'PM10 cannot be negative'],
    max: [1000, 'PM10 reading seems unusually high'],
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'PM10 must be a valid number'
    }
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature reading is required'],
    min: [-50, 'Temperature seems unusually low'],
    max: [80, 'Temperature seems unusually high'],
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Temperature must be a valid number'
    }
  },
  humidity: {
    type: Number,
    required: [true, 'Humidity reading is required'],
    min: [0, 'Humidity cannot be negative'],
    max: [100, 'Humidity cannot exceed 100%'],
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Humidity must be a valid number'
    }
  },
  co2: {
    type: Number,
    required: [true, 'CO2 reading is required'],
    min: [0, 'CO2 cannot be negative'],
    max: [10000, 'CO2 reading seems unusually high'],
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'CO2 must be a valid number'
    }
  },
  voc: {
    type: Number,
    required: [true, 'VOC reading is required'],
    min: [0, 'VOC cannot be negative'],
    max: [1000, 'VOC reading seems unusually high'],
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'VOC must be a valid number'
    }
  },
  aqi: {
    type: Number,
    required: [true, 'AQI is required'],
    min: [0, 'AQI cannot be negative'],
    max: [500, 'AQI cannot exceed 500'],
    validate: {
      validator: function(v) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'AQI must be a valid number'
    }
  },
  // Optional Location Data
  location: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Location name cannot exceed 100 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  batteryLevel: {
    type: Number,
    min: [0, 'Battery level cannot be negative'],
    max: [100, 'Battery level cannot exceed 100%']
  },
  signalStrength: {
    type: Number,
    min: [-120, 'Signal strength too low'],
    max: [0, 'Signal strength too high']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
airQualityDataSchema.index({ owner: 1, timestamp: -1 });
airQualityDataSchema.index({ deviceId: 1, timestamp: -1 });
airQualityDataSchema.index({ timestamp: -1 });
airQualityDataSchema.index({ owner: 1, deviceId: 1, timestamp: -1 });
airQualityDataSchema.index({ aqi: 1, timestamp: -1 });

// TTL index to automatically delete old data (optional - keep data for 1 year)
airQualityDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for air quality category based on AQI
airQualityDataSchema.virtual('airQualityCategory').get(function() {
  if (this.aqi <= 50) return 'Good';
  if (this.aqi <= 100) return 'Moderate';
  if (this.aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (this.aqi <= 200) return 'Unhealthy';
  if (this.aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
});

// Virtual for air quality color based on AQI
airQualityDataSchema.virtual('airQualityColor').get(function() {
  if (this.aqi <= 50) return '#00e400';      // Green - Good
  if (this.aqi <= 100) return '#ffff00';     // Yellow - Moderate
  if (this.aqi <= 150) return '#ff7e00';     // Orange - Unhealthy for Sensitive Groups
  if (this.aqi <= 200) return '#ff0000';     // Red - Unhealthy
  if (this.aqi <= 300) return '#8f3f97';     // Purple - Very Unhealthy
  return '#7e0023';                          // Maroon - Hazardous
});

// Virtual for data age
airQualityDataSchema.virtual('dataAge').get(function() {
  const now = new Date();
  const ageInMinutes = Math.floor((now - this.timestamp) / (1000 * 60));
  
  if (ageInMinutes < 1) return 'Just now';
  if (ageInMinutes < 60) return `${ageInMinutes} minutes ago`;
  
  const ageInHours = Math.floor(ageInMinutes / 60);
  if (ageInHours < 24) return `${ageInHours} hours ago`;
  
  const ageInDays = Math.floor(ageInHours / 24);
  return `${ageInDays} days ago`;
});

// Virtual for health recommendation
airQualityDataSchema.virtual('healthRecommendation').get(function() {
  if (this.aqi <= 50) {
    return 'Air quality is excellent. Great day for outdoor activities!';
  }
  if (this.aqi <= 100) {
    return 'Air quality is acceptable. Outdoor activities are generally safe.';
  }
  if (this.aqi <= 150) {
    return 'Air quality may affect sensitive individuals. Consider reducing prolonged outdoor activities.';
  }
  if (this.aqi <= 200) {
    return 'Air quality is unhealthy. Everyone should limit outdoor activities.';
  }
  if (this.aqi <= 300) {
    return 'Air quality is very unhealthy. Avoid outdoor activities and keep windows closed.';
  }
  return 'Air quality is hazardous. Stay indoors and use air purifiers if available.';
});

// Static Methods

// Get latest reading for a specific device
airQualityDataSchema.statics.getLatestByDevice = function(deviceId, populateOwner = false) {
  const query = this.findOne({ deviceId }).sort({ timestamp: -1 });
  return populateOwner ? query.populate('owner', 'name email') : query;
};

// Get latest reading for a user
airQualityDataSchema.statics.getLatestByOwner = function(ownerId) {
  return this.findOne({ owner: ownerId }).sort({ timestamp: -1 });
};

// Get readings within time range
airQualityDataSchema.statics.getReadingsInRange = function(ownerId, startDate, endDate, limit = 100) {
  return this.find({
    owner: ownerId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Get readings by device within time range
airQualityDataSchema.statics.getDeviceReadingsInRange = function(deviceId, startDate, endDate, limit = 100) {
  return this.find({
    deviceId: deviceId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Get average readings for a time period
airQualityDataSchema.statics.getAverageReadings = function(ownerId, hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(ownerId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        avgPM25: { $avg: '$pm25' },
        avgPM10: { $avg: '$pm10' },
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgCO2: { $avg: '$co2' },
        avgVOC: { $avg: '$voc' },
        avgAQI: { $avg: '$aqi' },
        minAQI: { $min: '$aqi' },
        maxAQI: { $max: '$aqi' },
        count: { $sum: 1 },
        latest: { $max: '$timestamp' },
        oldest: { $min: '$timestamp' }
      }
    }
  ]);
};

// Get hourly averages for charts
airQualityDataSchema.statics.getHourlyAverages = function(ownerId, hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(ownerId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        },
        avgPM25: { $avg: '$pm25' },
        avgPM10: { $avg: '$pm10' },
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgCO2: { $avg: '$co2' },
        avgVOC: { $avg: '$voc' },
        avgAQI: { $avg: '$aqi' },
        count: { $sum: 1 },
        timestamp: { $first: '$timestamp' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
    }
  ]);
};

// Get data quality statistics
airQualityDataSchema.statics.getDataQualityStats = function(ownerId, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(ownerId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$deviceId',
        totalReadings: { $sum: 1 },
        avgBatteryLevel: { $avg: '$batteryLevel' },
        avgSignalStrength: { $avg: '$signalStrength' },
        latestReading: { $max: '$timestamp' },
        oldestReading: { $min: '$timestamp' },
        avgAQI: { $avg: '$aqi' },
        dataGaps: {
          $sum: {
            $cond: [
              {
                $gt: [
                  { $subtract: ['$timestamp', { $lag: '$timestamp' }] },
                  1000 * 60 * 60 // 1 hour gap
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Get alert-worthy readings (high AQI)
airQualityDataSchema.statics.getAlertReadings = function(ownerId, aqiThreshold = 150, hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    owner: ownerId,
    aqi: { $gte: aqiThreshold },
    timestamp: { $gte: startDate }
  })
  .sort({ timestamp: -1 })
  .populate('owner', 'name email');
};

module.exports = mongoose.model('AirQualityData', airQualityDataSchema);