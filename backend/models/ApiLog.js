const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  method: {
    type: String,
    required: [true, 'HTTP method is required'],
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    uppercase: true
  },
  endpoint: {
    type: String,
    required: [true, 'Endpoint is required'],
    trim: true,
    maxlength: [500, 'Endpoint cannot exceed 500 characters']
  },
  statusCode: {
    type: Number,
    required: [true, 'Status code is required'],
    min: [100, 'Invalid HTTP status code'],
    max: [599, 'Invalid HTTP status code']
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: [1000, 'User agent cannot exceed 1000 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deviceApiKey: {
    type: String,
    default: null
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  responseTime: {
    type: Number, // in milliseconds
    min: [0, 'Response time cannot be negative']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  referer: {
    type: String,
    trim: true
  },
  requestSize: {
    type: Number,
    min: [0, 'Request size cannot be negative']
  },
  responseSize: {
    type: Number,
    min: [0, 'Response size cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
apiLogSchema.index({ timestamp: -1 });
apiLogSchema.index({ endpoint: 1, timestamp: -1 });
apiLogSchema.index({ statusCode: 1, timestamp: -1 });
apiLogSchema.index({ userId: 1, timestamp: -1 });
apiLogSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index to automatically delete old logs (keep logs for 90 days)
apiLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual for status category
apiLogSchema.virtual('statusCategory').get(function() {
  const code = this.statusCode;
  if (code >= 200 && code < 300) return 'Success';
  if (code >= 300 && code < 400) return 'Redirection';
  if (code >= 400 && code < 500) return 'Client Error';
  if (code >= 500) return 'Server Error';
  return 'Informational';
});

// Virtual for response time category
apiLogSchema.virtual('responseTimeCategory').get(function() {
  const time = this.responseTime;
  if (!time) return 'Unknown';
  if (time < 100) return 'Fast';
  if (time < 500) return 'Normal';
  if (time < 1000) return 'Slow';
  return 'Very Slow';
});

// Static method to get logs by date range
apiLogSchema.statics.getLogsByDateRange = function(startDate, endDate, limit = 100) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .populate('userId', 'name email')
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to get error logs
apiLogSchema.statics.getErrorLogs = function(hours = 24, limit = 50) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    statusCode: { $gte: 400 },
    timestamp: { $gte: startDate }
  })
  .populate('userId', 'name email')
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to get API usage statistics
apiLogSchema.statics.getUsageStats = function(hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          endpoint: '$endpoint',
          method: '$method'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
        errorCount: {
          $sum: {
            $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 20
    }
  ]);
};

module.exports = mongoose.model('ApiLog', apiLogSchema);