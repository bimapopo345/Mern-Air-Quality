import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import axios from 'axios';
import toast from 'react-hot-toast';
import AirQualityVisualization from '../components/AirQualityVisualization';
import KPICard from '../components/KPICard';
import AirQualityChart from '../components/AirQualityChart';
import DataTable from '../components/DataTable';
import DeviceStatus from '../components/DeviceStatus';
import './DashboardPage.css';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    latest: null,
    statistics: null,
    chartData: [],
    devices: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const [latestRes, chartRes, devicesRes, alertsRes] = await Promise.all([
        axios.get('/data/latest'),
        axios.get('/data/charts?hours=24&type=hourly'),
        axios.get('/users/me/devices'),
        axios.get('/data/alerts?threshold=100&hours=24')
      ]);

      setDashboardData({
        latest: latestRes.data.data,
        statistics: latestRes.data.statistics || null,
        chartData: chartRes.data.data || [],
        devices: devicesRes.data.devices || [],
        alerts: alertsRes.data.alerts || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  // Get AQI color based on value
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  // Get AQI category
  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const { latest, statistics, chartData, devices, alerts } = dashboardData;

  if (loading && !latest) {
    return (
      <div className="dashboard-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Activity size={40} />
        </motion.div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="header-info">
            <h1>Air Quality Dashboard</h1>
            <p>Real-time environmental monitoring and analytics</p>
          </div>
          <div className="header-actions">
            <motion.button
              className="refresh-button"
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              <motion.div
                animate={loading ? { rotate: 360 } : {}}
                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <Activity size={18} />
              </motion.div>
              Refresh
            </motion.button>
          </div>
        </div>
        
        {latest && (
          <div className="current-status">
            <div className="status-item">
              <span className="status-label">Current AQI</span>
              <span 
                className="status-value"
                style={{ color: getAQIColor(latest.aqi) }}
              >
                {latest.aqi}
              </span>
              <span className="status-category">
                {getAQICategory(latest.aqi)}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Last Updated</span>
              <span className="status-value">
                {new Date(latest.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Active Devices</span>
              <span className="status-value">{devices.length}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* 3D Visualization Section */}
        <motion.div 
          className="visualization-section glass-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="section-header">
            <h2>3D Air Quality Visualization</h2>
            <div className="visualization-controls">
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#00e400' }}></div>
                  <span>Good (0-50)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#ffff00' }}></div>
                  <span>Moderate (51-100)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#ff7e00' }}></div>
                  <span>Unhealthy (101-150)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="visualization-container">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <AirQualityVisualization data={latest} />
              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            </Canvas>
          </div>
          
          {latest && (
            <div className="visualization-info">
              <div className="info-item">
                <span>PM2.5: {latest.pm25} μg/m³</span>
              </div>
              <div className="info-item">
                <span>PM10: {latest.pm10} μg/m³</span>
              </div>
              <div className="info-item">
                <span>VOC: {latest.voc} ppb</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* KPI Cards */}
        <motion.div 
          className="kpi-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="kpi-grid">
            {latest && (
              <>
                <KPICard
                  title="Temperature"
                  value={`${latest.temperature}°C`}
                  icon={<Thermometer size={24} />}
                  trend={statistics?.avgTemperature ? 
                    (latest.temperature > statistics.avgTemperature ? 'up' : 'down') : null}
                  color="#ff6b6b"
                />
                <KPICard
                  title="Humidity"
                  value={`${latest.humidity}%`}
                  icon={<Droplets size={24} />}
                  trend={statistics?.avgHumidity ? 
                    (latest.humidity > statistics.avgHumidity ? 'up' : 'down') : null}
                  color="#4dabf7"
                />
                <KPICard
                  title="CO2"
                  value={`${latest.co2} ppm`}
                  icon={<Wind size={24} />}
                  trend={statistics?.avgCO2 ? 
                    (latest.co2 > statistics.avgCO2 ? 'up' : 'down') : null}
                  color="#69db7c"
                />
                <KPICard
                  title="AQI"
                  value={latest.aqi}
                  icon={<Activity size={24} />}
                  trend={statistics?.avgAQI ? 
                    (latest.aqi > statistics.avgAQI ? 'up' : 'down') : null}
                  color={getAQIColor(latest.aqi)}
                />
              </>
            )}
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div 
          className="charts-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="section-header">
            <h2>Air Quality Trends (24h)</h2>
            <div className="chart-controls">
              <select className="time-selector glass-input">
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
          <AirQualityChart data={chartData} />
        </motion.div>

        {/* Device Status */}
        <motion.div 
          className="devices-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="section-header">
            <h2>Connected Devices</h2>
            <div className="devices-summary">
              <span>{devices.filter(d => d.status === 'online').length} Online</span>
              <span>{devices.filter(d => d.status === 'offline').length} Offline</span>
            </div>
          </div>
          <DeviceStatus devices={devices} />
        </motion.div>

        {/* Recent Data Table */}
        <motion.div 
          className="data-table-section glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="section-header">
            <h2>Recent Readings</h2>
            <button className="view-all-button">
              View All <TrendingUp size={16} />
            </button>
          </div>
          <DataTable limit={10} />
        </motion.div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <motion.div 
            className="alerts-section glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="section-header">
              <h2>
                <AlertTriangle size={20} />
                Air Quality Alerts
              </h2>
              <span className="alert-count">{alerts.length}</span>
            </div>
            <div className="alerts-list">
              {alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="alert-item">
                  <div className="alert-icon">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="alert-content">
                    <span className="alert-message">
                      High AQI detected: {alert.aqi}
                    </span>
                    <span className="alert-time">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="alert-device">
                    {alert.deviceId}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;