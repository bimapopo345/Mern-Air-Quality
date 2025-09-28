const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    },
    default: 'user'
  },
  deviceApiKey: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  deviceApiKeyLastUsed: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ deviceApiKey: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for device API key status
userSchema.virtual('deviceApiKeyStatus').get(function() {
  if (!this.deviceApiKeyLastUsed) return 'never_used';
  
  const daysSinceLastUse = Math.floor((Date.now() - this.deviceApiKeyLastUsed) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastUse === 0) return 'active_today';
  if (daysSinceLastUse <= 7) return 'active_this_week';
  if (daysSinceLastUse <= 30) return 'active_this_month';
  return 'inactive';
});

// Virtual for user status
userSchema.virtual('userStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (!this.lastLogin) return 'never_logged_in';
  
  const daysSinceLogin = Math.floor((Date.now() - this.lastLogin) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLogin === 0) return 'active_today';
  if (daysSinceLogin <= 7) return 'active_this_week';
  if (daysSinceLogin <= 30) return 'active_this_month';
  return 'inactive';
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  try {
    // Update the updatedAt field
    this.updatedAt = new Date();
    
    // Hash password if it has been modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Generate device API key if it's a new user or if explicitly requested
    if (this.isNew || (this.isModified('deviceApiKey') && !this.deviceApiKey)) {
      this.deviceApiKey = this.generateDeviceApiKey();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-find middleware to exclude inactive users by default
userSchema.pre(/^find/, function(next) {
  // Only apply this filter if isActive is not explicitly set in the query
  if (!this.getQuery().hasOwnProperty('isActive')) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// Instance Methods

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  // We need to explicitly select the password field since it's excluded by default
  const user = await this.constructor.findById(this._id).select('+password');
  return await bcrypt.compare(candidatePassword, user.password);
};

// Method to generate device API key
userSchema.methods.generateDeviceApiKey = function() {
  const prefix = 'daq'; // Device Air Quality
  const timestamp = Date.now().toString(36); // Base36 timestamp for uniqueness
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${timestamp}_${randomBytes}`;
};

// Method to regenerate device API key
userSchema.methods.regenerateDeviceApiKey = async function() {
  this.deviceApiKey = this.generateDeviceApiKey();
  this.deviceApiKeyLastUsed = null;
  await this.save();
  return this.deviceApiKey;
};

// Method to update API key last used timestamp
userSchema.methods.updateApiKeyUsage = async function() {
  this.deviceApiKeyLastUsed = new Date();
  return this.save({ validateBeforeSave: false }); // Skip validation for performance
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Method to deactivate user
userSchema.methods.deactivate = async function() {
  this.isActive = false;
  return this.save();
};

// Method to activate user
userSchema.methods.activate = async function() {
  this.isActive = true;
  return this.save();
};

// Hide sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  
  // Mask the API key for security (show only first 8 and last 4 characters)
  if (user.deviceApiKey && user.deviceApiKey.length > 12) {
    const maskedKey = user.deviceApiKey.substring(0, 8) + 
                     '*'.repeat(user.deviceApiKey.length - 12) + 
                     user.deviceApiKey.substring(user.deviceApiKey.length - 4);
    user.deviceApiKeyMasked = maskedKey;
  }
  
  return user;
};

// Static Methods

// Static method to find user by device API key
userSchema.statics.findByDeviceApiKey = function(apiKey) {
  return this.findOne({ deviceApiKey: apiKey, isActive: true });
};

// Static method to find user with password (for authentication)
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
          }
        },
        adminUsers: {
          $sum: {
            $cond: [{ $eq: ['$role', 'admin'] }, 1, 0]
          }
        },
        usersWithApiKeyUsage: {
          $sum: {
            $cond: [{ $ne: ['$deviceApiKeyLastUsed', null] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Static method to get recently active users
userSchema.statics.getRecentlyActiveUsers = function(days = 30) {
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    $or: [
      { lastLogin: { $gte: dateThreshold } },
      { deviceApiKeyLastUsed: { $gte: dateThreshold } }
    ],
    isActive: true
  }).sort({ lastLogin: -1, deviceApiKeyLastUsed: -1 });
};

module.exports = mongoose.model('User', userSchema);