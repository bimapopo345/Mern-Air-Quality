import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // AI Quotes of the Day
  const aiQuotes = [
    {
      text: "The future belongs to organizations that can turn today's information into tomorrow's insight.",
      author: "Unknown"
    },
    {
      text: "Data is the new oil, but unlike oil, data becomes more valuable when refined through intelligence.",
      author: "Tech Visionary"
    },
    {
      text: "In the symphony of technology, IoT devices are the instruments, and data is the music they create.",
      author: "Digital Pioneer"
    },
    {
      text: "Clean air is not a luxury, it's a necessity. Smart monitoring makes it a reality.",
      author: "Environmental Advocate"
    },
    {
      text: "Every sensor tells a story. Every data point is a chapter in the book of environmental health.",
      author: "Data Scientist"
    },
    {
      text: "The intersection of AI and environmental monitoring is where tomorrow's solutions are born today.",
      author: "Innovation Leader"
    }
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % aiQuotes.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [aiQuotes.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = async (role) => {
    setIsLoading(true);
    
    const credentials = role === 'admin' 
      ? { email: 'admin@company.com', password: 'admin123' }
      : { email: 'john.doe@company.com', password: 'user123' };
    
    const result = await login(credentials.email, credentials.password);
    
    if (result.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Column - Login Form */}
        <motion.div 
          className="login-form-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="login-form-container">
            {/* Logo */}
            <motion.div 
              className="login-logo"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Activity size={40} />
              <h1>AirQ Dashboard</h1>
            </motion.div>

            {/* Welcome Text */}
            <motion.div 
              className="login-welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2>Welcome Back</h2>
              <p>Sign in to your corporate IoT air quality dashboard</p>
            </motion.div>

            {/* Login Form */}
            <motion.form 
              className="login-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="login-button"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="button-spinner">
                    <div className="spinner"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </motion.form>

            {/* Demo Accounts */}
            <motion.div 
              className="demo-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="demo-text">Demo Accounts:</p>
              <div className="demo-buttons">
                <button
                  type="button"
                  className="demo-button admin-demo"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                >
                  Admin Demo
                </button>
                <button
                  type="button"
                  className="demo-button user-demo"
                  onClick={() => handleDemoLogin('user')}
                  disabled={isLoading}
                >
                  User Demo
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Column - Engaging Content */}
        <motion.div 
          className="login-content-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="content-overlay">
            {/* Mission Statement */}
            <motion.div 
              className="mission-statement"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2>Transforming Data into a Healthier Tomorrow</h2>
              <p>
                Harness the power of IoT sensors and artificial intelligence to monitor, 
                analyze, and optimize air quality in your corporate environment. 
                Real-time insights for a sustainable future.
              </p>
            </motion.div>

            {/* AI Quote of the Day */}
            <motion.div 
              className="quote-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3>AI Quote of the Day</h3>
              <motion.div
                key={currentQuote}
                className="quote-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <blockquote>
                  "{aiQuotes[currentQuote].text}"
                </blockquote>
                <cite>— {aiQuotes[currentQuote].author}</cite>
              </motion.div>
              
              {/* Quote Navigation Dots */}
              <div className="quote-dots">
                {aiQuotes.map((_, index) => (
                  <button
                    key={index}
                    className={`quote-dot ${index === currentQuote ? 'active' : ''}`}
                    onClick={() => setCurrentQuote(index)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div 
              className="feature-highlights"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="feature">
                <div className="feature-icon">🌬️</div>
                <span>Real-time Air Quality Monitoring</span>
              </div>
              <div className="feature">
                <div className="feature-icon">🤖</div>
                <span>AI-Powered Analytics</span>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <span>Interactive 3D Visualizations</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;