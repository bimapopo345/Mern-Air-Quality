import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal, 
  MapPin, 
  Calendar,
  Activity
} from 'lucide-react';
import './DeviceStatus.css';

const DeviceStatus = ({ devices = [] }) => {
  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'online':
        return { icon: <Wifi size={16} />, color: '#00e400', label: 'Online' };
      case 'recently_active':
        return { icon: <Activity size={16} />, color: '#ffd43b', label: 'Recently Active' };
      case 'offline':
        return { icon: <WifiOff size={16} />, color: '#ff6b6b', label: 'Offline' };
      default:
        return { icon: <WifiOff size={16} />, color: '#6c757d', label: 'Unknown' };
    }
  };

  // Get battery level color
  const getBatteryColor = (level) => {
    if (level > 70) return '#00e400';
    if (level > 30) return '#ffd43b';
    return '#ff6b6b';
  };

  // Get signal strength bars
  const getSignalBars = (strength) => {
    if (!strength) return 0;
    const normalizedStrength = Math.abs(strength);
    if (normalizedStrength <= 30) return 4; // Excellent
    if (normalizedStrength <= 50) return 3; // Good
    if (normalizedStrength <= 70) return 2; // Fair
    if (normalizedStrength <= 90) return 1; // Poor
    return 0; // Very Poor
  };

  if (devices.length === 0) {
    return (
      <div className="no-devices">
        <Activity size={48} />
        <h3>No Devices Connected</h3>
        <p>Connect your IoT sensors to start monitoring air quality</p>
      </div>
    );
  }

  return (
    <div className="device-status-container">
      {devices.map((device, index) => {
        const statusDisplay = getStatusDisplay(device.status);
        const batteryColor = getBatteryColor(device.lastBatteryLevel);
        const signalBars = getSignalBars(device.lastSignalStrength);
        
        return (
          <motion.div
            key={device.deviceId || `device-${index}`}
            className={`device-card glass-card ${device.status}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            {/* Device Header */}
            <div className="device-header">
              <div className="device-info">
                <h4 className="device-name">{device.deviceId}</h4>
                <div className="device-status">
                  <span 
                    className="status-indicator"
                    style={{ color: statusDisplay.color }}
                  >
                    {statusDisplay.icon}
                    {statusDisplay.label}
                  </span>
                </div>
              </div>
              
              {/* AQI Badge */}
              {device.avgAQI && (
                <div 
                  className="aqi-badge"
                  style={{ 
                    backgroundColor: getAQIColor(device.avgAQI),
                    color: device.avgAQI > 150 ? '#ffffff' : '#000000'
                  }}
                >
                  {Math.round(device.avgAQI)}
                </div>
              )}
            </div>

            {/* Device Metrics */}
            <div className="device-metrics">
              {/* Battery Level */}
              {device.lastBatteryLevel && (
                <div className="metric">
                  <div className="metric-icon">
                    <Battery size={14} style={{ color: batteryColor }} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-label">Battery</span>
                    <span className="metric-value" style={{ color: batteryColor }}>
                      {device.lastBatteryLevel}%
                    </span>
                  </div>
                  <div className="battery-indicator">
                    <div 
                      className="battery-fill"
                      style={{ 
                        width: `${device.lastBatteryLevel}%`,
                        backgroundColor: batteryColor
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Signal Strength */}
              {device.lastSignalStrength && (
                <div className="metric">
                  <div className="metric-icon">
                    <Signal size={14} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-label">Signal</span>
                    <span className="metric-value">
                      {device.lastSignalStrength} dBm
                    </span>
                  </div>
                  <div className="signal-bars">
                    {[1, 2, 3, 4].map(bar => (
                      <div 
                        key={bar}
                        className={`signal-bar ${bar <= signalBars ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Total Readings */}
              <div className="metric">
                <div className="metric-icon">
                  <Activity size={14} />
                </div>
                <div className="metric-content">
                  <span className="metric-label">Readings</span>
                  <span className="metric-value">
                    {device.totalReadings?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>

              {/* Location */}
              {device.location?.name && (
                <div className="metric">
                  <div className="metric-icon">
                    <MapPin size={14} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-label">Location</span>
                    <span className="metric-value">{device.location.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Last Reading Time */}
            <div className="device-footer">
              <div className="last-reading">
                <Calendar size={12} />
                <span>
                  Last reading: {new Date(device.latestReading).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Status indicator light */}
            <div 
              className="status-light"
              style={{ backgroundColor: statusDisplay.color }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

// Helper function for AQI colors
const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
};

export default DeviceStatus;