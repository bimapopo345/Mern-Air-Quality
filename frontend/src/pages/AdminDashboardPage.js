import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Search,
  RefreshCw,
  Activity,
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  Users,
  Mail,
  Clock,
  ShieldCheck,
  Database,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar
} from 'lucide-react';
import KPICard from '../components/KPICard';
import AirQualityChart from '../components/AirQualityChart';
import DeviceStatus from '../components/DeviceStatus';
import DataTable from '../components/DataTable';
import './AdminDashboardPage.css';

const INITIAL_DASHBOARD_STATE = {
  latest: null,
  statistics: null,
  chartData: [],
  devices: [],
  alerts: []
};

const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState(() => ({ ...INITIAL_DASHBOARD_STATE }));
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Database view states
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'database'
  const [allData, setAllData] = useState([]);
  const [dataStats, setDataStats] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataPage, setDataPage] = useState(1);
  const [dataTotal, setDataTotal] = useState(0);
  const [dataLimit, setDataLimit] = useState(50);
  const [dataFilters, setDataFilters] = useState({
    user_id: '',
    deviceId: '',
    startDate: '',
    endDate: '',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadUsers = useCallback(async (preserveSelection = true) => {
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

      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);

      if (!fetchedUsers.length) {
        setSelectedUserId(null);
        setDashboardData({ ...INITIAL_DASHBOARD_STATE });
        return;
      }

      const currentSelectionExists = fetchedUsers.some(user => getUserId(user) === selectedUserId);
      if (!preserveSelection || (!selectedUserId || !currentSelectionExists)) {
        setSelectedUserId(getUserId(fetchedUsers[0]));
      }
    } catch (error) {
      console.error('Failed to load users for admin dashboard:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const fetchDashboardData = useCallback(async (targetUserId) => {
    if (!targetUserId) {
      setDashboardData({ ...INITIAL_DASHBOARD_STATE });
      return;
    }

    setDashboardLoading(true);
    try {
      const [latestResult, chartResult, devicesResult, alertsResult, summaryResult] = await Promise.allSettled([
        axios.get('/api/data/latest', { params: { userId: targetUserId, includeOwner: true } }),
        axios.get('/api/data/charts', { params: { hours: 24, type: 'hourly', userId: targetUserId } }),
        axios.get('/api/users/me/devices', { params: { userId: targetUserId } }),
        axios.get('/api/data/alerts', { params: { threshold: 100, hours: 24, userId: targetUserId } }),
        axios.get('/api/data', { params: { limit: 1, userId: targetUserId } })
      ]);

      if (chartResult.status !== 'fulfilled') throw chartResult.reason;
      if (devicesResult.status !== 'fulfilled') throw devicesResult.reason;
      if (alertsResult.status !== 'fulfilled') throw alertsResult.reason;

      let latestData = null;
      if (latestResult.status === 'fulfilled') {
        latestData = latestResult.value.data.data;
      } else if (latestResult.reason?.response?.status === 404) {
        console.warn('No latest data for selected user yet.');
      } else if (latestResult.status === 'rejected') {
        throw latestResult.reason;
      }

      const statistics = summaryResult.status === 'fulfilled'
        ? summaryResult.value.data.statistics || null
        : null;

      setDashboardData({
        latest: latestData,
        statistics,
        chartData: chartResult.value.data.data || [],
        devices: devicesResult.value.data.devices || [],
        alerts: alertsResult.value.data.alerts || []
      });
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error);
      toast.error('Failed to load selected user data');
      setDashboardData({ ...INITIAL_DASHBOARD_STATE });
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchDashboardData(selectedUserId);
    }
  }, [selectedUserId, fetchDashboardData]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(term);
      const emailMatch = user.email?.toLowerCase().includes(term);
      return nameMatch || emailMatch;
    });
  }, [users, searchTerm]);

  const selectedUser = useMemo(
    () => users.find(user => getUserId(user) === selectedUserId) || null,
    [users, selectedUserId]
  );

  const handleUserSelect = (userId) => {
    if (userId === selectedUserId) return;
    setSelectedUserId(userId);
  };

  const handleRefreshUsers = () => loadUsers(false);

  const handleRefreshData = () => {
    if (selectedUserId) {
      fetchDashboardData(selectedUserId);
    }
  };

  // Database view functions
  const fetchAllData = useCallback(async (page = 1, filters = dataFilters) => {
    setLoadingData(true);
    try {
      const params = {
        page,
        limit: dataLimit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await axios.get('/api/admin/data/all', { params });
      
      setAllData(response.data.data || []);
      setDataStats(response.data.statistics || {});
      setDataTotal(response.data.pagination?.total || 0);
      setDataPage(response.data.pagination?.page || 1);
    } catch (error) {
      console.error('Failed to fetch all data:', error);
      toast.error('Failed to load database data');
    } finally {
      setLoadingData(false);
    }
  }, [dataFilters, dataLimit]);

  // Fetch specific user's all data
  const fetchUserData = useCallback(async (userId, page = 1) => {
    setLoadingData(true);
    try {
      const params = {
        page,
        limit: dataLimit,
        userId: userId,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      };

      const response = await axios.get('/api/admin/data/all', { params });
      
      setAllData(response.data.data || []);
      setDataStats(response.data.statistics || {});
      setDataTotal(response.data.pagination?.total || 0);
      setDataPage(response.data.pagination?.page || 1);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoadingData(false);
    }
  }, [dataLimit]);

  useEffect(() => {
    if (viewMode === 'database') {
      fetchAllData();
    }
  }, [viewMode, fetchAllData]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...dataFilters, [key]: value };
    setDataFilters(newFilters);
    setDataPage(1); // Reset to first page when filters change
    fetchAllData(1, newFilters);
  };

  const handleUserSelectForData = (userId) => {
    if (userId) {
      // Update filters to show only selected user's data
      const newFilters = { ...dataFilters, user_id: userId };
      setDataFilters(newFilters);
      setDataPage(1);
      fetchAllData(1, newFilters);
      toast.success(`Showing data for selected user`);
    } else {
      // Show all users data
      const newFilters = { ...dataFilters, user_id: '' };
      setDataFilters(newFilters);
      setDataPage(1);
      fetchAllData(1, newFilters);
      toast.success(`Showing data for all users`);
    }
  };

  const handlePageChange = (newPage) => {
    setDataPage(newPage);
    fetchAllData(newPage, dataFilters);
  };

  const exportToCSV = () => {
    if (allData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Timestamp', 'User', 'User Email', 'Device ID', 'AQI', 'PM2.5', 'PM10', 
      'Temperature', 'Humidity', 'CO2', 'VOC', 'Location'
    ];
    
    const csvContent = [
      headers.join(','),
      ...allData.map(row => [
        new Date(row.timestamp).toLocaleString(),
        `"${row.owner?.name || 'Unknown'}"`,
        `"${row.owner?.email || 'Unknown'}"`,
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
    a.download = `air_quality_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const { latest, statistics, chartData, devices, alerts } = dashboardData;

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <p>Monitor users and air quality data across the system</p>
        </div>
        <div className="admin-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => setViewMode('dashboard')}
          >
            <Activity size={16} />
            Dashboard View
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'database' ? 'active' : ''}`}
            onClick={() => setViewMode('database')}
          >
            <Database size={16} />
            Database View
          </button>
        </div>
      </div>

      <div className="admin-dashboard-layout">
        {/* User Selection moved to top of dashboard */}
        <motion.div 
          className="admin-user-selector glass-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="admin-user-selector-header">
            <div className="panel-title">
              <Users size={20} />
              <h2>Select User</h2>
            </div>
            <button 
              className="refresh-button"
              onClick={handleRefreshUsers}
              disabled={loadingUsers}
            >
              <RefreshCw className={loadingUsers ? 'spinning' : ''} size={16} />
              Refresh
            </button>
          </div>

          <div className="admin-user-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search user by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-user-list-horizontal">
            {loadingUsers ? (
              <div className="admin-user-loading">
                <RefreshCw className="spinning" size={18} />
                <span>Loading users...</span>
              </div>
            ) : (
              <>
                {/* View All Users Option */}
                <button
                  className={`admin-user-item glass-card ${!dataFilters.user_id ? 'active' : ''}`}
                  onClick={() => handleUserSelectForData('')}
                >
                  <div className="admin-user-item-header">
                    <span className="user-name">🌐 All Users</span>
                    <span className="user-role-badge">global</span>
                  </div>
                  <div className="admin-user-item-meta">
                    <span>View all data from all users</span>
                    <span>{dataStats?.totalReadings || 0} total readings</span>
                  </div>
                  <div className="admin-user-item-stats">
                    <span>{users.length} users</span>
                    <span>Complete Database</span>
                  </div>
                </button>

                {filteredUsers.map(user => {
                  const userId = getUserId(user);
                  const isActive = userId === selectedUserId;
                  const isDataSelected = userId === dataFilters.user_id;
                  const stats = user.statistics || {};

                  return (
                    <button
                      key={userId}
                      className={`admin-user-item glass-card ${isActive ? 'active' : ''} ${isDataSelected ? 'data-selected' : ''}`}
                      onClick={() => {
                        handleUserSelect(userId);
                        if (viewMode === 'database') {
                          handleUserSelectForData(userId);
                        }
                      }}
                    >
                      <div className="admin-user-item-header">
                        <span className="user-name">{user.name}</span>
                        <span className={`user-role-badge ${user.role}`}>{user.role}</span>
                      </div>
                      <div className="admin-user-item-meta">
                        <span>{user.email}</span>
                        <span>{stats.totalReadings || 0} readings</span>
                      </div>
                      <div className="admin-user-item-stats">
                        <span>{stats.uniqueDevices || 0} devices</span>
                        <span>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {viewMode === 'database' && isDataSelected && (
                        <div className="data-selected-indicator">
                          <Database size={14} />
                          <span>Viewing Data</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {!loadingUsers && filteredUsers.length === 0 && (
              <div className="admin-user-empty">
                <Activity size={18} />
                <span>No users match your search</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="admin-dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {selectedUser ? (
            <div className="admin-dashboard-inner">
              <div className="admin-dashboard-header">
                <div>
                  <h1>Admin Dashboard Overview</h1>
                  <p>Monitor sensor activity and air quality for each user</p>
                </div>
                <button 
                  className="refresh-button primary"
                  onClick={handleRefreshData}
                  disabled={dashboardLoading}
                >
                  <RefreshCw className={dashboardLoading ? 'spinning' : ''} size={16} />
                  Refresh Data
                </button>
              </div>

              <div className="selected-user-summary glass-card">
                <div className="summary-header">
                  <div>
                    <h2>{selectedUser.name}</h2>
                    <div className="summary-info">
                      <span><Mail size={14} /> {selectedUser.email}</span>
                      <span><Users size={14} /> {selectedUser.role}</span>
                    </div>
                  </div>
                  <div className={`user-status ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="summary-grid">
                  <div>
                    <span className="summary-label">Total Readings</span>
                    <span className="summary-value">{selectedUser.statistics?.totalReadings || 0}</span>
                  </div>
                  <div>
                    <span className="summary-label">Devices</span>
                    <span className="summary-value">{selectedUser.statistics?.uniqueDevices || 0}</span>
                  </div>
                  <div>
                    <span className="summary-label">Last Login</span>
                    <span className="summary-value">
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {dashboardLoading && (
                <div className="admin-dashboard-loading">
                  <RefreshCw className="spinning" size={18} />
                  <span>Refreshing data...</span>
                </div>
              )}

              {latest ? (
                <div className="admin-status-grid">
                  <div className="glass-card admin-status-card">
                    <div className="admin-status-header">
                      <span>Current AQI</span>
                      <span className="status-value" style={{ color: getAQIColor(latest.aqi) }}>
                        {latest.aqi}
                      </span>
                      <span className="status-subtitle">{getAQICategory(latest.aqi)}</span>
                    </div>
                    <div className="status-meta">
                      <span><Clock size={12} /> {formatTimestamp(latest.timestamp)}</span>
                      <span>Device: {latest.deviceId}</span>
                    </div>
                  </div>

                  <div className="admin-kpi-grid">
                    <KPICard
                      title="Temperature"
                      value={`${latest.temperature}�C`}
                      icon={<Thermometer size={24} />}
                      trend={statistics?.avgTemperature ? (latest.temperature > statistics.avgTemperature ? 'up' : 'down') : null}
                      color="#ff6b6b"
                    />
                    <KPICard
                      title="Humidity"
                      value={`${latest.humidity}%`}
                      icon={<Droplets size={24} />}
                      trend={statistics?.avgHumidity ? (latest.humidity > statistics.avgHumidity ? 'up' : 'down') : null}
                      color="#4dabf7"
                    />
                    <KPICard
                      title="CO2"
                      value={`${latest.co2} ppm`}
                      icon={<Wind size={24} />}
                      trend={statistics?.avgCO2 ? (latest.co2 > statistics.avgCO2 ? 'up' : 'down') : null}
                      color="#69db7c"
                    />
                    <KPICard
                      title="AQI"
                      value={latest.aqi}
                      icon={<Activity size={24} />}
                      trend={statistics?.avgAQI ? (latest.aqi > statistics.avgAQI ? 'up' : 'down') : null}
                      color={getAQIColor(latest.aqi)}
                    />
                  </div>
                </div>
              ) : (
                <div className="glass-card admin-no-latest">
                  <AlertTriangle size={18} />
                  <div>
                    <h3>No recent readings</h3>
                    <p>This user has not submitted any data yet.</p>
                  </div>
                </div>
              )}

              <div className="glass-card admin-chart-card">
                <div className="card-header">
                  <h3>Air Quality Trend (24h)</h3>
                </div>
                <AirQualityChart data={chartData} />
              </div>

              <div className="glass-card admin-devices-card">
                <div className="card-header">
                  <h3>Connected Devices</h3>
                  <span className="card-subtitle">{devices.length} device(s)</span>
                </div>
                <DeviceStatus devices={devices} />
              </div>

              <div className="glass-card admin-table-card">
                <div className="card-header">
                  <h3>Recent Readings</h3>
                </div>
                <DataTable limit={10} userId={selectedUserId} key={selectedUserId || 'no-user'} />
              </div>

              <div className="glass-card admin-alerts-card">
                <div className="card-header">
                  <h3>Alerts (Last 24h)</h3>
                  <span className="card-subtitle">{alerts.length} alert(s)</span>
                </div>
                {alerts.length > 0 ? (
                  <div className="admin-alerts-list">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <div key={`${alert._id || index}`} className="admin-alert-item">
                        <div className="alert-icon">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="alert-details">
                          <span className="alert-message">High AQI detected: {alert.aqi}</span>
                          <span className="alert-meta">
                            {formatTimestamp(alert.timestamp)} � {alert.deviceId}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-no-alerts">
                    <ShieldCheck size={18} />
                    <span>No alerts in the selected period</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-no-selection glass-card">
              <Activity size={36} />
              <h3>Select a user to view dashboard data</h3>
              <p>Choose a user from the list to inspect their device readings and statistics.</p>
            </div>
          )}
        </motion.div>

        {viewMode === 'database' && (
          <motion.div 
            className="admin-database-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="database-controls glass-card">
              <div className="database-controls-header">
                <h2>Database Explorer</h2>
                <div className="database-actions">
                  <button
                    className="filter-toggle-btn"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={16} />
                    Filters
                    {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    className="export-btn"
                    onClick={exportToCSV}
                    disabled={allData.length === 0}
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                  <button
                    className="refresh-button"
                    onClick={() => fetchAllData(dataPage, dataFilters)}
                    disabled={loadingData}
                  >
                    <RefreshCw className={loadingData ? 'spinning' : ''} size={16} />
                    Refresh
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="database-filters">
                  <div className="filter-row">
                    <div className="filter-group">
                      <label>User</label>
                      <select
                        value={dataFilters.user_id}
                        onChange={(e) => handleFilterChange('user_id', e.target.value)}
                      >
                        <option value="">All Users</option>
                        {users.map(user => (
                          <option key={getUserId(user)} value={getUserId(user)}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Device ID</label>
                      <input
                        type="text"
                        placeholder="Filter by device ID"
                        value={dataFilters.deviceId}
                        onChange={(e) => handleFilterChange('deviceId', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="filter-row">
                    <div className="filter-group">
                      <label>Start Date</label>
                      <input
                        type="datetime-local"
                        value={dataFilters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      />
                    </div>
                    <div className="filter-group">
                      <label>End Date</label>
                      <input
                        type="datetime-local"
                        value={dataFilters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      />
                    </div>
                    <div className="filter-group">
                      <label>Sort By</label>
                      <select
                        value={dataFilters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      >
                        <option value="timestamp">Timestamp</option>
                        <option value="aqi">AQI</option>
                        <option value="pm25">PM2.5</option>
                        <option value="temperature">Temperature</option>
                        <option value="humidity">Humidity</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Sort Order</label>
                      <select
                        value={dataFilters.sortOrder}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {dataStats && (
                <div className="database-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Readings:</span>
                    <span className="stat-value">{dataStats.totalReadings?.toLocaleString() || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average AQI:</span>
                    <span className="stat-value">{Math.round(dataStats.avgAQI || 0)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unique Devices:</span>
                    <span className="stat-value">{dataStats.uniqueDevices?.length || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unique Users:</span>
                    <span className="stat-value">{dataStats.uniqueUsers?.length || 0}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="database-table-container glass-card">
              {loadingData ? (
                <div className="database-loading">
                  <RefreshCw className="spinning" size={24} />
                  <span>Loading database data...</span>
                </div>
              ) : allData.length > 0 ? (
                <>
                  <div className="database-table-wrapper">
                    <table className="database-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>User</th>
                          <th>Device ID</th>
                          <th>AQI</th>
                          <th>PM2.5</th>
                          <th>PM10</th>
                          <th>Temp</th>
                          <th>Humidity</th>
                          <th>CO2</th>
                          <th>VOC</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allData.map((row, index) => (
                          <tr key={row._id || index}>
                            <td>{new Date(row.timestamp).toLocaleString()}</td>
                            <td>
                              <div className="user-cell">
                                <span className="user-name">{row.owner?.name || 'Unknown'}</span>
                                <span className="user-email">{row.owner?.email || ''}</span>
                              </div>
                            </td>
                            <td>{row.deviceId}</td>
                            <td>
                              <span 
                                className="aqi-value"
                                style={{ color: getAQIColor(row.aqi) }}
                              >
                                {row.aqi}
                              </span>
                            </td>
                            <td>{row.pm25}</td>
                            <td>{row.pm10}</td>
                            <td>{row.temperature}°C</td>
                            <td>{row.humidity}%</td>
                            <td>{row.co2}</td>
                            <td>{row.voc}</td>
                            <td>{row.location?.name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {dataTotal > dataLimit && (
                    <div className="database-pagination">
                      <button
                        onClick={() => handlePageChange(dataPage - 1)}
                        disabled={dataPage === 1}
                        className="pagination-btn"
                      >
                        Previous
                      </button>
                      <span className="pagination-info">
                        Page {dataPage} of {Math.ceil(dataTotal / dataLimit)} 
                        ({dataTotal.toLocaleString()} total records)
                      </span>
                      <button
                        onClick={() => handlePageChange(dataPage + 1)}
                        disabled={dataPage >= Math.ceil(dataTotal / dataLimit)}
                        className="pagination-btn"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="database-empty">
                  <Database size={48} />
                  <h3>No data found</h3>
                  <p>Try adjusting your filters or check if there's any data in the database.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const getUserId = (user) => user?._id || user?.id || null;

const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
};

const getAQICategory = (aqi) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'USG';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const formatTimestamp = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

export default AdminDashboardPage;
