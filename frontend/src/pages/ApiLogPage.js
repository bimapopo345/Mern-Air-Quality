import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Search,
  RefreshCw, 
  Calendar, 
  Clock, 
  Globe, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Download
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ApiLogPage.css';

const ApiLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    method: '',
    statusCode: '',
    hours: '24',
    endpoint: '',
    page: 1,
    limit: 50
  });
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('logs');

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          params[key] = filters[key];
        }
      });

      const response = await axios.get('/api/admin/logs', { params });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load API logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/logs/stats', {
        params: { hours: filters.hours }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load API statistics');
    }
  };

  const fetchLogsCallback = useCallback(fetchLogs, [filters]);
  const fetchStatsCallback = useCallback(fetchStats, [filters.hours]);
  
  useEffect(() => {
    fetchLogsCallback();
    if (activeTab === 'stats') {
      fetchStatsCallback();
    }
  }, [fetchLogsCallback, fetchStatsCallback, activeTab]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  // Get status color and icon
  const getStatusDisplay = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return { color: '#00e400', icon: <CheckCircle size={16} />, category: 'Success' };
    }
    if (statusCode >= 300 && statusCode < 400) {
      return { color: '#ffd43b', icon: <RefreshCw size={16} />, category: 'Redirect' };
    }
    if (statusCode >= 400 && statusCode < 500) {
      return { color: '#ff7e00', icon: <AlertTriangle size={16} />, category: 'Client Error' };
    }
    if (statusCode >= 500) {
      return { color: '#ff0000', icon: <XCircle size={16} />, category: 'Server Error' };
    }
    return { color: '#6c757d', icon: <Activity size={16} />, category: 'Unknown' };
  };

  // Get method color
  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return '#00e400';
      case 'POST': return '#3b82f6';
      case 'PUT': return '#ffd43b';
      case 'DELETE': return '#ff6b6b';
      case 'PATCH': return '#8b5cf6';
      default: return '#6c757d';
    }
  };

  // Export logs
  const exportLogs = async () => {
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '' && key !== 'page') {
          params[key] = filters[key];
        }
      });
      params.limit = 1000; // Export more logs

      const response = await axios.get('/api/admin/logs', { params });
      const logsData = response.data.logs || [];
      
      const csvContent = [
        ['Timestamp', 'Method', 'Endpoint', 'Status', 'Response Time', 'IP Address', 'User Agent'].join(','),
        ...logsData.map(log => [
          new Date(log.timestamp).toISOString(),
          log.method,
          log.endpoint,
          log.statusCode,
          log.responseTime || 0,
          log.ipAddress,
          `"${log.userAgent || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `api-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('API logs exported successfully');
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast.error('Failed to export logs');
    }
  };

  return (
    <div className="api-log-page">
      {/* Header */}
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="header-info">
            <h1>
              <Activity size={28} />
              API Logs & Analytics
            </h1>
            <p>Monitor API usage, performance, and error tracking</p>
          </div>
          <div className="header-actions">
            <motion.button
              className="refresh-button glass-button"
              onClick={() => {
                fetchLogs();
                if (activeTab === 'stats') fetchStats();
              }}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={loading ? 'spinning' : ''} size={18} />
              Refresh
            </motion.button>
            <motion.button
              className="export-button glass-button"
              onClick={exportLogs}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={18} />
              Export
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Activity size={18} />
          API Logs
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={18} />
          Statistics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'logs' && (
        <motion.div 
          className="logs-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Filters */}
          <div className="filters-section glass-card">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Search Endpoint</label>
                <div className="search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search endpoints..."
                    value={filters.endpoint}
                    onChange={(e) => handleFilterChange('endpoint', e.target.value)}
                    className="glass-input"
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>Method</label>
                <select
                  value={filters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                  className="glass-input"
                >
                  <option value="">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Status Code</label>
                <select
                  value={filters.statusCode}
                  onChange={(e) => handleFilterChange('statusCode', e.target.value)}
                  className="glass-input"
                >
                  <option value="">All Status</option>
                  <option value="200">200 - OK</option>
                  <option value="201">201 - Created</option>
                  <option value="400">400 - Bad Request</option>
                  <option value="401">401 - Unauthorized</option>
                  <option value="403">403 - Forbidden</option>
                  <option value="404">404 - Not Found</option>
                  <option value="500">500 - Server Error</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Time Range</label>
                <select
                  value={filters.hours}
                  onChange={(e) => handleFilterChange('hours', e.target.value)}
                  className="glass-input"
                >
                  <option value="1">Last Hour</option>
                  <option value="6">Last 6 Hours</option>
                  <option value="24">Last 24 Hours</option>
                  <option value="168">Last Week</option>
                  <option value="720">Last Month</option>
                </select>
              </div>
            </div>
            
            <div className="filter-info">
              <span>{logs.length} logs found</span>
            </div>
          </div>

          {/* Logs Table */}
          <div className="logs-table-section glass-card">
            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spinning" size={32} />
                <span>Loading API logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <Activity size={64} />
                <h3>No Logs Found</h3>
                <p>No API logs match your current filters.</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Method</th>
                        <th>Endpoint</th>
                        <th>Status</th>
                        <th>Response Time</th>
                        <th>IP Address</th>
                        <th>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => {
                        const statusDisplay = getStatusDisplay(log.statusCode);
                        
                        return (
                          <motion.tr
                            key={log._id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                            className="log-row"
                          >
                            <td className="timestamp-cell">
                              <div className="timestamp-info">
                                <Calendar size={14} />
                                <div>
                                  <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                  <div className="time-small">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td>
                              <span 
                                className="method-badge"
                                style={{ backgroundColor: getMethodColor(log.method) }}
                              >
                                {log.method}
                              </span>
                            </td>
                            
                            <td className="endpoint-cell">
                              <code className="endpoint-code">{log.endpoint}</code>
                            </td>
                            
                            <td>
                              <div 
                                className="status-badge"
                                style={{ color: statusDisplay.color }}
                              >
                                {statusDisplay.icon}
                                <span>{log.statusCode}</span>
                              </div>
                            </td>
                            
                            <td>
                              <div className="response-time">
                                <Clock size={14} />
                                <span>{log.responseTime || 0}ms</span>
                              </div>
                            </td>
                            
                            <td>
                              <div className="ip-address">
                                <Globe size={14} />
                                <span>{log.ipAddress}</span>
                              </div>
                            </td>
                            
                            <td>
                              {log.userId ? (
                                <div className="user-info">
                                  <div className="user-avatar-small">
                                    {log.userId.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{log.userId.name}</span>
                                </div>
                              ) : log.deviceApiKey ? (
                                <div className="device-info">
                                  <Smartphone size={14} />
                                  <span>IoT Device</span>
                                </div>
                              ) : (
                                <span className="anonymous">Anonymous</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-button"
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      disabled={filters.page === 1}
                    >
                      Previous
                    </button>
                    
                    <div className="page-info">
                      <span>Page {filters.page} of {totalPages}</span>
                    </div>
                    
                    <button
                      className="page-button"
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={filters.page === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <motion.div 
          className="stats-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {stats && (
            <>
              {/* Usage Statistics */}
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <div className="stat-header">
                    <h3>Most Used Endpoints</h3>
                  </div>
                  <div className="stat-content">
                    {stats.usageStats?.slice(0, 5).map((endpoint, index) => (
                      <div key={index} className="endpoint-stat">
                        <div className="endpoint-info">
                          <span 
                            className="method-tag"
                            style={{ backgroundColor: getMethodColor(endpoint._id.method) }}
                          >
                            {endpoint._id.method}
                          </span>
                          <code className="endpoint-path">{endpoint._id.endpoint}</code>
                        </div>
                        <div className="endpoint-metrics">
                          <span className="request-count">{endpoint.count} requests</span>
                          <span className="avg-time">{Math.round(endpoint.avgResponseTime)}ms avg</span>
                        </div>
                      </div>
                    )) || <p>No usage data available</p>}
                  </div>
                </div>

                <div className="stat-card glass-card">
                  <div className="stat-header">
                    <h3>Recent Errors</h3>
                  </div>
                  <div className="stat-content">
                    {stats.recentErrors?.slice(0, 5).map((error, index) => (
                      <div key={index} className="error-stat">
                        <div className="error-info">
                          <div 
                            className="error-status"
                            style={{ color: getStatusDisplay(error.statusCode).color }}
                          >
                            {getStatusDisplay(error.statusCode).icon}
                            <span>{error.statusCode}</span>
                          </div>
                          <code className="error-endpoint">{error.endpoint}</code>
                        </div>
                        <div className="error-time">
                          {new Date(error.timestamp).toLocaleString()}
                        </div>
                      </div>
                    )) || <p>No recent errors</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ApiLogPage;