import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <motion.div
          className="not-found-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated 404 */}
          <motion.div
            className="error-code"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span>4</span>
            <motion.div
              className="icon-container"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Activity size={60} />
            </motion.div>
            <span>4</span>
          </motion.div>

          {/* Error Message */}
          <motion.div
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1>Page Not Found</h1>
            <p>
              The page you're looking for doesn't exist or has been moved.
              <br />
              Let's get you back to monitoring air quality data!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="error-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              className="action-button primary"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={20} />
              Go to Dashboard
            </motion.button>

            <motion.button
              className="action-button secondary"
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={20} />
              Go Back
            </motion.button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            className="helpful-links"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h3>Quick Links</h3>
            <div className="links-grid">
              <button 
                className="link-item"
                onClick={() => navigate('/dashboard')}
              >
                📊 Dashboard
              </button>
              <button 
                className="link-item"
                onClick={() => navigate('/profile')}
              >
                👤 Profile
              </button>
              <button 
                className="link-item"
                onClick={() => navigate('/ai-helper')}
              >
                🤖 AI Helper
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;