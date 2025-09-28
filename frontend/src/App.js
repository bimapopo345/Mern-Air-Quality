import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AiHelperPage from './pages/AiHelperPage';
import UserManagementPage from './pages/UserManagementPage';
import ApiLogPage from './pages/ApiLogPage';
import NotFoundPage from './pages/NotFoundPage';

// Styles
import './styles/App.css';
import './styles/glassmorphism.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            {/* Animated Background */}
            <div className="app-background">
              <div className="animated-gradient"></div>
              <div className="particle-field">
                {[...Array(50)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="particle"
                    animate={{
                      y: [0, -100, 0],
                      x: [0, Math.random() * 100 - 50, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: Math.random() * 10 + 10,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Main Application Content */}
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/ai-helper" element={
                  <ProtectedRoute>
                    <Layout>
                      <AiHelperPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/users" element={
                  <ProtectedRoute adminOnly={true}>
                    <Layout>
                      <UserManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/logs" element={
                  <ProtectedRoute adminOnly={true}>
                    <Layout>
                      <ApiLogPage />
                    </Layout>
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(17, 34, 64, 0.95)',
                  color: '#64ffda',
                  border: '1px solid rgba(100, 255, 218, 0.2)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  fontFamily: "'Inter', sans-serif"
                },
                success: {
                  iconTheme: {
                    primary: '#64ffda',
                    secondary: '#0a192f'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#ff6b6b',
                    secondary: '#0a192f'
                  }
                }
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;