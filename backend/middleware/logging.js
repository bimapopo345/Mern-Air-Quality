const ApiLog = require('../models/ApiLog');

/**
 * Middleware to log all API requests
 */
const logApiRequests = (req, res, next) => {
  const startTime = Date.now();

  // Capture original res.end to log when response is complete
  const originalEnd = res.end;
  let responseSize = 0;

  // Override res.end to log the request when response is complete
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (chunk) {
      responseSize += Buffer.byteLength(chunk);
    }

    // Prepare log data
    const logData = {
      method: req.method,
      endpoint: req.originalUrl || req.url,
      statusCode: res.statusCode,
      ipAddress: getClientIpAddress(req),
      userAgent: req.get('User-Agent') || '',
      userId: req.userId || null,
      deviceApiKey: req.deviceApiKey || null,
      requestBody: getRequestBodyForLogging(req),
      responseTime: responseTime,
      timestamp: new Date(startTime),
      referer: req.get('Referer') || '',
      requestSize: getRequestSize(req),
      responseSize: responseSize
    };

    // Save log to database (async, don't block response)
    saveApiLog(logData);

    // Call original res.end
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Get client IP address from request
 */
function getClientIpAddress(req) {
  return req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Get request body for logging (sanitized)
 */
function getRequestBodyForLogging(req) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return null;
  }

  // Create a copy to avoid modifying original
  const body = JSON.parse(JSON.stringify(req.body));

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
  
  function removeSensitiveData(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        removeSensitiveData(obj[key]);
      }
    }
    return obj;
  }

  return removeSensitiveData(body);
}

/**
 * Calculate request size
 */
function getRequestSize(req) {
  let size = 0;
  
  // Headers size (approximate)
  if (req.headers) {
    size += JSON.stringify(req.headers).length;
  }
  
  // Body size
  if (req.body) {
    size += JSON.stringify(req.body).length;
  }
  
  return size;
}

/**
 * Save API log to database
 */
async function saveApiLog(logData) {
  try {
    // Skip logging for certain endpoints to reduce noise
    const skipEndpoints = [
      '/api/status',
      '/api/health',
      '/favicon.ico',
      '/robots.txt'
    ];

    if (skipEndpoints.some(endpoint => logData.endpoint.includes(endpoint))) {
      return;
    }

    // Truncate large request bodies for storage efficiency
    if (logData.requestBody && JSON.stringify(logData.requestBody).length > 10000) {
      logData.requestBody = { 
        truncated: true, 
        size: JSON.stringify(logData.requestBody).length 
      };
    }

    const apiLog = new ApiLog(logData);
    await apiLog.save();
  } catch (error) {
    // Don't let logging errors affect the main application
    console.error('Error saving API log:', error);
  }
}

module.exports = {
  logApiRequests
};