import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  Key,
  Calendar,
  Activity,
  RefreshCw,
  User,
  Mail,
  Lock,
  Save
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './UserManagementPage.css';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users', {
        params: {
          page,
          limit: 20,
          search: searchTerm,
          role: roleFilter
        }
      });
      
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersCallback = useCallback(fetchUsers, [page, searchTerm, roleFilter]);
  
  useEffect(() => {
    fetchUsersCallback();
  }, [fetchUsersCallback]);

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/auth/register', newUser);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    }
  };

  // Update user
  const handleUpdateUser = async (userId, updates) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, updates);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to deactivate user "${userName}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to deactivate user';
      toast.error(message);
    }
  };

  // Get user status badge
  const getUserStatusBadge = (user) => {
    if (!user.isActive) {
      return <span className="status-badge inactive">Inactive</span>;
    }
    
    const daysSinceLogin = user.lastLogin ? 
      Math.floor((Date.now() - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24)) : null;
    
    if (!daysSinceLogin) {
      return <span className="status-badge never-logged">Never Logged In</span>;
    }
    
    if (daysSinceLogin === 0) {
      return <span className="status-badge active">Active Today</span>;
    }
    
    if (daysSinceLogin <= 7) {
      return <span className="status-badge recent">Active This Week</span>;
    }
    
    if (daysSinceLogin <= 30) {
      return <span className="status-badge recent">Active This Month</span>;
    }
    
    return <span className="status-badge inactive">Inactive</span>;
  };

  return (
    <div className="user-management-page">
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
              <Users size={28} />
              User Management
            </h1>
            <p>Manage user accounts, roles, and permissions</p>
          </div>
          <div className="header-actions">
            <motion.button
              className="refresh-button glass-button"
              onClick={fetchUsers}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={loading ? 'spinning' : ''} size={18} />
              Refresh
            </motion.button>
            <motion.button
              className="create-button glass-button primary"
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} />
              Add User
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="filters-section glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="filters-content">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="search-input glass-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="role-filter glass-input"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
        
        <div className="results-info">
          <span>{users.length} users found</span>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div 
        className="users-table-section glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinning" size={32} />
            <span>Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Users size={64} />
            <h3>No Users Found</h3>
            <p>No users match your current filters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>API Key Usage</th>
                  <th>Data</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user._id || user.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="user-row"
                  >
                    <td className="user-cell">
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="user-details">
                          <span className="user-name">{user.name || 'N/A'}</span>
                          <span className="user-email">{user.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? (
                          <ShieldCheck size={14} />
                        ) : (
                          <Shield size={14} />
                        )}
                        {user.role}
                      </div>
                    </td>
                    
                    <td>
                      {getUserStatusBadge(user)}
                    </td>
                    
                    <td>
                      <div className="api-usage">
                        <Key size={14} />
                        <span>
                          {user.deviceApiKeyLastUsed ? 
                            new Date(user.deviceApiKeyLastUsed).toLocaleDateString() : 
                            'Never'
                          }
                        </span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="data-stats">
                        <Activity size={14} />
                        <span>{user.statistics?.totalReadings || 0} readings</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="created-date">
                        <Calendar size={14} />
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div className="action-buttons">
                        <motion.button
                          className="action-button edit"
                          onClick={() => setEditingUser(user)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Edit User"
                        >
                          <Edit size={14} />
                        </motion.button>
                        <motion.button
                          className="action-button delete"
                          onClick={() => handleDeleteUser(user._id || user.id, user.name)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Deactivate User"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <motion.div 
            className="modal glass-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="modal-header">
              <h2>Create New User</h2>
              <button 
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-input"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="glass-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type="password"
                    id="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="glass-input"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="glass-input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-button glass-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-button glass-button primary"
                >
                  <Plus size={18} />
                  Create User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <motion.div 
            className="modal glass-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="modal-header">
              <h2>Edit User</h2>
              <button 
                className="close-button"
                onClick={() => setEditingUser(null)}
              >
                ×
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updates = {
                  name: formData.get('name'),
                  email: formData.get('email'),
                  role: formData.get('role'),
                  isActive: formData.get('isActive') === 'on'
                };
                handleUpdateUser(editingUser._id || editingUser.id, updates);
              }}
              className="modal-form"
            >
              <div className="form-group">
                <label htmlFor="edit-name">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    defaultValue={editingUser.name}
                    className="glass-input"
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    defaultValue={editingUser.email}
                    className="glass-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  name="role"
                  defaultValue={editingUser.role}
                  className="glass-input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingUser.isActive}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  Active User
                </label>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-button glass-button"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="submit-button glass-button primary"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;