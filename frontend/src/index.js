import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';

// Configure axios defaults
// Use direct baseURL to backend for now (proxy having issues)
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.timeout = 10000;

// Add request interceptor for better error handling
axios.interceptors.request.use(
  (config) => {
    // Add timestamp to requests for debugging
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axios.interceptors.response.use(
  (response) => {
    // Calculate request duration
    response.config.metadata.endTime = new Date();
    response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${response.duration}ms)`);
    }
    
    return response;
  },
  (error) => {
    if (error.config) {
      error.config.metadata.endTime = new Date();
      error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ ${error.config.method.toUpperCase()} ${error.config.url} - ${error.response?.status || 'Network Error'} (${error.duration}ms)`);
      }
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);