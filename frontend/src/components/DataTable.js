import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  Calendar, 
  MapPin, 
  Activity,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import './DataTable.css';

const DataTable = ({ limit = 10 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/data', {
        params: {
          limit,
          page,
          sortBy: sortField,
          sortOrder: sortDirection
        }
      });
      
      setData(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataCallback = useCallback(fetchData, [page, sortField, sortDirection, limit]);
  
  useEffect(() => {
    fetchDataCallback();
  }, [fetchDataCallback]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  // Get AQI color
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
    if (aqi <= 150) return 'USG';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  // Table columns configuration
  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: (value) => (
        <div className="timestamp-cell">
          <Calendar size={14} />
          <div>
            <div>{new Date(value).toLocaleDateString()}</div>
            <div className="time-small">{new Date(value).toLocaleTimeString()}</div>
          </div>
        </div>
      )
    },
    {
      key: 'deviceId',
      label: 'Device',
      sortable: true,
      render: (value) => (
        <div className="device-cell">
          <Activity size={14} />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'aqi',
      label: 'AQI',
      sortable: true,
      render: (value) => (
        <div className="aqi-cell">
          <div 
            className="aqi-badge"
            style={{ 
              backgroundColor: getAQIColor(value),
              color: value > 150 ? '#ffffff' : '#000000'
            }}
          >
            {value}
          </div>
          <span className="aqi-category">{getAQICategory(value)}</span>
        </div>
      )
    },
    {
      key: 'pm25',
      label: 'PM2.5',
      sortable: true,
      render: (value) => <span>{value} μg/m³</span>
    },
    {
      key: 'pm10',
      label: 'PM10',
      sortable: true,
      render: (value) => <span>{value} μg/m³</span>
    },
    {
      key: 'temperature',
      label: 'Temp',
      sortable: true,
      render: (value) => <span>{value}°C</span>
    },
    {
      key: 'humidity',
      label: 'Humidity',
      sortable: true,
      render: (value) => <span>{value}%</span>
    },
    {
      key: 'co2',
      label: 'CO2',
      sortable: true,
      render: (value) => <span>{value} ppm</span>
    },
    {
      key: 'location',
      label: 'Location',
      sortable: false,
      render: (value) => value?.name ? (
        <div className="location-cell">
          <MapPin size={14} />
          <span>{value.name}</span>
        </div>
      ) : (
        <span className="no-location">—</span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="data-table-loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading data...</span>
      </div>
    );
  }

  return (
    <motion.div 
      className="data-table-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Table Header Actions */}
      <div className="table-actions">
        <div className="table-info">
          <span>{data.length} records</span>
        </div>
        <div className="table-controls">
          <button 
            className="refresh-button"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spinning' : ''} size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={column.sortable ? 'sortable' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="header-content">
                    <span>{column.label}</span>
                    {column.sortable && sortField === column.key && (
                      <div className="sort-icon">
                        {sortDirection === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <motion.tr
                key={row._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="table-row"
              >
                {columns.map((column) => (
                  <td key={column.key} className={`cell-${column.key}`}>
                    {column.render ? 
                      column.render(row[column.key]) : 
                      row[column.key] || '—'
                    }
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Data Message */}
      {data.length === 0 && !loading && (
        <div className="no-data">
          <Activity size={48} />
          <h3>No Data Available</h3>
          <p>No air quality readings found. Check your sensors or try refreshing.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-button"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          
          <div className="page-info">
            <span>Page {page} of {totalPages}</span>
          </div>
          
          <button
            className="page-button"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default DataTable;