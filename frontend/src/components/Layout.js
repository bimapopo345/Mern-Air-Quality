import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  User, 
  MessageSquare, 
  Users, 
  Activity,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open di desktop
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Close sidebar di mobile by default
      } else {
        setSidebarOpen(true); // Open sidebar di desktop by default
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      adminOnly: false
    },
    {
      name: 'Profile',
      icon: User,
      path: '/profile',
      adminOnly: false
    },
    {
      name: 'AI Helper',
      icon: MessageSquare,
      path: '/ai-helper',
      adminOnly: false
    },
    {
      name: 'User Management',
      icon: Users,
      path: '/admin/users',
      adminOnly: true
    },
    {
      name: 'API Logs',
      icon: Activity,
      path: '/admin/logs',
      adminOnly: true
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const filteredNavItems = navigationItems.filter(item => 
    !item.adminOnly || isAdmin()
  );

  return (
    <div className="layout">
      {/* Sidebar */}
      <motion.aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        initial={false}
        animate={{ x: isMobile ? (sidebarOpen ? 0 : -280) : (sidebarOpen ? 0 : -280) }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="sidebar-content">
          {/* Logo */}
          <div className="sidebar-header">
            <motion.div
              className="logo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="logo-icon">
                <Activity size={24} />
              </div>
              <h1 className="logo-text">AirQ Dashboard</h1>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isCurrentPath(item.path);
                
                return (
                  <li key={item.path}>
                    <motion.button
                      className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      whileHover={{ x: 8 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.name}</p>
                <p className="user-role">{user?.role}</p>
              </div>
            </div>
            
            <div className="sidebar-actions">
              <motion.button
                className="action-button"
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Settings"
              >
                <Settings size={18} />
              </motion.button>
              
              <motion.button
                className="action-button logout-button"
                onClick={handleLogout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Logout"
              >
                <LogOut size={18} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        {/* Header */}
        <header className="header">
          <motion.button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={sidebarOpen ? 'Close Menu' : 'Open Menu'}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>

          <div className="header-title">
            <h2>{navigationItems.find(item => isCurrentPath(item.path))?.name || 'Dashboard'}</h2>
          </div>

          <div className="header-actions">
            <div className="user-badge">
              <span className="user-name-header">{user?.name}</span>
              <div className="user-avatar-small">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="content-wrapper"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && isMobile && (
        <motion.div
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;