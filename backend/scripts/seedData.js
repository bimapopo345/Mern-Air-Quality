const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const AirQualityData = require('../models/AirQualityData');

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    await User.deleteMany({});
    await AirQualityData.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@company.com',
      password: 'admin123', // Will be hashed automatically
      role: 'admin'
    });
    await adminUser.save();
    console.log('👨‍💼 Created admin user:', adminUser.email);
    console.log('🔑 Admin API Key:', adminUser.deviceApiKey);

    // Create regular user
    const regularUser = new User({
      name: 'John Doe',
      email: 'john.doe@company.com',
      password: 'user123', // Will be hashed automatically
      role: 'user'
    });
    await regularUser.save();
    console.log('👤 Created regular user:', regularUser.email);
    console.log('🔑 User API Key:', regularUser.deviceApiKey);

    // Create additional test user
    const testUser = new User({
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      password: 'user123',
      role: 'user'
    });
    await testUser.save();
    console.log('👤 Created test user:', testUser.email);
    console.log('🔑 Test User API Key:', testUser.deviceApiKey);

    // Generate sample air quality data for the past 7 days
    console.log('📊 Generating sample air quality data...');
    
    const devices = ['AIR-SENSOR-001', 'AIR-SENSOR-002', 'AIR-SENSOR-003'];
    const users = [adminUser, regularUser, testUser];
    const sampleData = [];

    // Generate data for the past 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (let user of users) {
      for (let device of devices.slice(0, user.role === 'admin' ? 3 : 2)) {
        // Generate hourly data for the past 7 days
        for (let time = sevenDaysAgo; time <= now; time = new Date(time.getTime() + 60 * 60 * 1000)) {
          // Simulate realistic air quality variations
          const baseAQI = 50 + Math.random() * 100; // Base AQI between 50-150
          const timeVariation = Math.sin((time.getHours() * Math.PI) / 12) * 20; // Daily cycle
          const randomVariation = (Math.random() - 0.5) * 30; // Random variation
          
          const aqi = Math.max(0, Math.min(300, baseAQI + timeVariation + randomVariation));
          
          // Calculate related values based on AQI
          const pm25 = Math.max(0, (aqi * 0.4) + (Math.random() - 0.5) * 10);
          const pm10 = Math.max(0, pm25 * 1.5 + (Math.random() - 0.5) * 5);
          const temperature = 20 + Math.sin((time.getHours() * Math.PI) / 12) * 5 + (Math.random() - 0.5) * 4;
          const humidity = 45 + Math.random() * 30;
          const co2 = 400 + Math.random() * 600;
          const voc = Math.random() * 5;

          const dataPoint = new AirQualityData({
            owner: user._id,
            deviceId: device,
            pm25: Math.round(pm25 * 10) / 10,
            pm10: Math.round(pm10 * 10) / 10,
            temperature: Math.round(temperature * 10) / 10,
            humidity: Math.round(humidity * 10) / 10,
            co2: Math.round(co2),
            voc: Math.round(voc * 10) / 10,
            aqi: Math.round(aqi),
            location: {
              name: `Office Floor ${devices.indexOf(device) + 1}`,
              coordinates: {
                latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
                longitude: -74.0060 + (Math.random() - 0.5) * 0.01
              }
            },
            batteryLevel: 85 + Math.random() * 15,
            signalStrength: -50 - Math.random() * 20,
            timestamp: time
          });

          sampleData.push(dataPoint);
        }
      }
    }

    // Insert all sample data
    await AirQualityData.insertMany(sampleData);
    console.log(`📈 Created ${sampleData.length} sample air quality readings`);

    // Update API key usage timestamps for realism
    for (let user of users) {
      user.deviceApiKeyLastUsed = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      user.lastLogin = new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000);
      await user.save();
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ ADMIN USER                                                  │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Email: ${adminUser.email.padEnd(48)} │`);
    console.log('│ Password: admin123                                          │');
    console.log(`│ API Key: ${adminUser.deviceApiKey.substring(0, 20)}...       │`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ REGULAR USER                                                │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Email: ${regularUser.email.padEnd(43)} │`);
    console.log('│ Password: user123                                           │');
    console.log(`│ API Key: ${regularUser.deviceApiKey.substring(0, 20)}...       │`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ TEST USER                                                   │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Email: ${testUser.email.padEnd(44)} │`);
    console.log('│ Password: user123                                           │');
    console.log(`│ API Key: ${testUser.deviceApiKey.substring(0, 20)}...       │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    console.log('\n📱 Sample Device Integration:');
    console.log('Use any of the API keys above with the following endpoint:');
    console.log(`POST ${process.env.CORS_ORIGIN || 'http://localhost:3000'}/api/data`);
    console.log('Header: X-API-Key: [your-api-key]');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;