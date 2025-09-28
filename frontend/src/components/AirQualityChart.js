import React from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { motion } from 'framer-motion';
import './AirQualityChart.css';

const AirQualityChart = ({ data = [] }) => {
  // Format data for chart
  const formatData = (rawData) => {
    return rawData.map(item => ({
      time: new Date(item.timestamp || item._id?.year + '-' + item._id?.month + '-' + item._id?.day + ' ' + (item._id?.hour || 0) + ':00').toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      fullTime: new Date(item.timestamp || item._id?.year + '-' + item._id?.month + '-' + item._id?.day + ' ' + (item._id?.hour || 0) + ':00'),
      aqi: Math.round(item.avgAQI || item.aqi || 0),
      pm25: Math.round((item.avgPM25 || item.pm25 || 0) * 10) / 10,
      pm10: Math.round((item.avgPM10 || item.pm10 || 0) * 10) / 10,
      temperature: Math.round((item.avgTemperature || item.temperature || 0) * 10) / 10,
      humidity: Math.round((item.avgHumidity || item.humidity || 0) * 10) / 10,
      co2: Math.round(item.avgCO2 || item.co2 || 0),
      voc: Math.round((item.avgVOC || item.voc || 0) * 10) / 10
    })).sort((a, b) => a.fullTime - b.fullTime);
  };

  const chartData = formatData(data);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip glass-card">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${getUnit(entry.dataKey)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get unit for different metrics
  const getUnit = (dataKey) => {
    switch (dataKey) {
      case 'aqi': return '';
      case 'pm25':
      case 'pm10': return ' μg/m³';
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'co2': return ' ppm';
      case 'voc': return ' ppb';
      default: return '';
    }
  };

  // AQI zones for future enhancement
  // const getAQIZones = () => [
  //   { value: 0, color: 'rgba(0, 228, 0, 0.1)' },
  //   { value: 50, color: 'rgba(255, 255, 0, 0.1)' },
  //   { value: 100, color: 'rgba(255, 126, 0, 0.1)' },
  //   { value: 150, color: 'rgba(255, 0, 0, 0.1)' },
  //   { value: 200, color: 'rgba(143, 63, 151, 0.1)' },
  //   { value: 300, color: 'rgba(126, 0, 35, 0.1)' }
  // ];

  if (!chartData.length) {
    return (
      <div className="chart-no-data">
        <p>No data available for chart</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="air-quality-chart"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64ffda" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#64ffda" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffd43b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ffd43b" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(100, 255, 218, 0.1)" 
              vertical={false}
            />
            
            <XAxis 
              dataKey="time" 
              stroke="#64ffda"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis 
              stroke="#64ffda"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{ color: '#64ffda' }}
              iconType="line"
            />
            
            {/* AQI Area Chart */}
            <Area
              type="monotone"
              dataKey="aqi"
              stroke="#64ffda"
              strokeWidth={2}
              fill="url(#aqiGradient)"
              name="AQI"
            />
            
            {/* PM2.5 Line */}
            <Line
              type="monotone"
              dataKey="pm25"
              stroke="#ff6b6b"
              strokeWidth={2}
              dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="PM2.5"
            />
            
            {/* Temperature Line */}
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ffd43b"
              strokeWidth={2}
              dot={{ fill: '#ffd43b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Temperature"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart Legend with additional info */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#64ffda' }}></div>
          <span>AQI (Air Quality Index)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff6b6b' }}></div>
          <span>PM2.5 (μg/m³)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ffd43b' }}></div>
          <span>Temperature (°C)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AirQualityChart;