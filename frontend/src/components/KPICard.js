import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './KPICard.css';

const KPICard = ({ title, value, icon, trend, color = '#64ffda', subtitle }) => {
  return (
    <motion.div 
      className="kpi-card glass-card"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="kpi-header">
        <div className="kpi-icon" style={{ color }}>
          {icon}
        </div>
        {trend && (
          <div className={`kpi-trend ${trend}`}>
            {trend === 'up' ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
          </div>
        )}
      </div>
      
      <div className="kpi-content">
        <h3 className="kpi-title">{title}</h3>
        <div className="kpi-value" style={{ color }}>
          {value}
        </div>
        {subtitle && (
          <p className="kpi-subtitle">{subtitle}</p>
        )}
      </div>
      
      <div className="kpi-accent" style={{ backgroundColor: color }}></div>
    </motion.div>
  );
};

export default KPICard;