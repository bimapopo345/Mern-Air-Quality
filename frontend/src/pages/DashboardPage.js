import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Database,
  Download,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  const { user, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    latest: null,
    statistics: null,
    chartData: [],
    devices: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  
  // Admin-specific states
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [allUserData, setAllUserData] = useState(null);
  const [loadingAllUserData, setLoadingAllUserData] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const [latestResult, chartResult, devicesResult, alertsResult] = await Promise.allSettled([
        axios.get('/api/data/latest'),
        axios.get('/api/data/charts?hours=24&type=hourly'),
        axios.get('/api/users/me/devices'),
        axios.get('/api/data/alerts?threshold=100&hours=24')
      ]);

      if (chartResult.status !== 'fulfilled') throw chartResult.reason;
      if (devicesResult.status !== 'fulfilled') throw devicesResult.reason;
      if (alertsResult.status !== 'fulfilled') throw alertsResult.reason;

      let latestData = null;
      let statistics = null;

      if (latestResult.status === 'fulfilled') {
        latestData = latestResult.value.data.data;
        statistics = latestResult.value.data.statistics || null;
      } else if (latestResult.reason?.response?.status !== 404) {
        throw latestResult.reason;
      } else {
        console.warn('No latest air quality data available yet.');
      }

      setDashboardData({
        latest: latestData,
        statistics,
        chartData: chartResult.value.data.data || [],
        devices: devicesResult.value.data.devices || [],
        alerts: alertsResult.value.data.alerts || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load users for admin
  const loadUsers = useCallback(async () => {
    if (!isAdmin()) return;
    
    setLoadingUsers(true);
    try {
      const response = await axios.get('/api/admin/users', {
        params: {
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc'
        }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    if (isAdmin()) {
      loadUsers();
    }

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAdmin, loadUsers]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  // Fetch all data for selected user
  const handleFetchAllUserData = async (userId) => {
    if (!userId) {
      toast.error('Please select a user first');
      return;
    }

    setLoadingAllUserData(true);
    try {
      const response = await axios.get('/api/admin/data/all', {
        params: {
          userId: userId,
          limit: 10000,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        }
      });
      
      const userData = response.data.data || [];
      setAllUserData(userData);
      toast.success(`Loaded ${userData.length} records for user`);
    } catch (error) {
      console.error('Failed to fetch all user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoadingAllUserData(false);
    }
  };

  // Export user data to CSV
  const exportUserDataToCSV = (data, selectedUser) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Timestamp', 'Device ID', 'AQI', 'PM2.5', 'PM10', 
      'Temperature', 'Humidity', 'CO2', 'VOC', 'Location'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        new Date(row.timestamp).toLocaleString(),
        `"${row.deviceId}"`,
        row.aqi,
        row.pm25,
        row.pm10,
        row.temperature,
        row.humidity,
        row.co2,
        row.voc,
        `"${row.location?.name || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedUser?.name || 'user'}_all_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('User data exported successfully');
  };

  const getUserId = (user) => user?._id || user?.id || null;

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
      {/* Admin User Selection Card */}
      {isAdmin() && (
        <motion.div 
          className="admin-user-selection-card glass-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="admin-user-selection-header">
            <div className="selection-title">
              <Users size={20} />
              <h3>Admin User Selection</h3>
            </div>
            <button 
              className="fetch-all-data-btn"
              onClick={() => handleFetchAllUserData(selectedUserId)}
              disabled={!selectedUserId || loadingAllUserData}
            >
              <Database size={16} />
              {loadingAllUserData ? 'Loading...' : 'Fetch All Data'}
            </button>
          </div>
          <div className="user-selection-content">
            <div className="dropdown-container">
              <label>Select User to View Complete Data:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="user-dropdown"
                disabled={loadingUsers}
              >
                <option value="">Choose a user...</option>
                {users.map(user => (
                  <option key={getUserId(user)} value={getUserId(user)}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>
            {selectedUserId && (
              <div className="selected-user-info">
                {(() => {
                  const selectedUser = users.find(u => getUserId(u) === selectedUserId);
                  return selectedUser ? (
                    <>
                      <div className="user-info-row">
                        <span className="info-label">Selected:</span>
                        <span className="info-value">{selectedUser.name}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="info-label">Total Readings:</span>
                        <span className="info-value">{selectedUser.statistics?.totalReadings || 0}</span>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* All User Data Display */}
      {allUserData && allUserData.length > 0 && (
        <motion.div 
          className="all-user-data-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="all-user-data-header">
            <h3>All Data for {users.find(u => getUserId(u) === selectedUserId)?.name}</h3>
            <div className="data-actions">
              <span className="data-count">{allUserData.length} records</span>
              <button 
                className="export-user-data-btn"
                onClick={() => exportUserDataToCSV(allUserData, users.find(u => getUserId(u) === selectedUserId))}
              >
                <Download size={16} />
                Export CSV
              </button>
              <button 
                className="close-data-btn"
                onClick={() => setAllUserData(null)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="user-data-table-container">
            <table className="user-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Device ID</th>
                  <th>AQI</th>
                  <th>PM2.5</th>
                  <th>PM10</th>
                  <th>Temperature</th>
                  <th>Humidity</th>
                  <th>CO2</th>
                  <th>VOC</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {allUserData.slice(0, 20).map((data, index) => (
                  <tr key={data._id || index}>
                    <td>{new Date(data.timestamp).toLocaleString()}</td>
                    <td>{data.deviceId}</td>
                    <td>
                      <span 
                        className="aqi-value"
                        style={{ color: getAQIColor(data.aqi) }}
                      >
                        {data.aqi}
                      </span>
                    </td>
                    <td>{data.pm25}</td>
                    <td>{data.pm10}</td>
                    <td>{data.temperature}°C</td>
                    <td>{data.humidity}%</td>
                    <td>{data.co2}</td>
                    <td>{data.voc}</td>
                    <td>{data.location?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allUserData.length > 20 && (
              <div className="table-footer">
                <p>Showing first 20 of {allUserData.length} records</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

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
