import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  Save,
  Mail,
  Shield,
  Calendar,
  Activity,
  Download,
  Code,
  Smartphone
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [apiKeyData, setApiKeyData] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState({
    profile: false,
    apiKey: false,
    regenerate: false
  });
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch API key info
  const fetchApiKeyInfo = async () => {
    try {
      setLoading(prev => ({ ...prev, apiKey: true }));
      const response = await axios.get('/users/me/api-key');
      setApiKeyData(response.data.apiKey);
    } catch (error) {
      console.error('Failed to fetch API key info:', error);
      toast.error('Failed to load API key information');
    } finally {
      setLoading(prev => ({ ...prev, apiKey: false }));
    }
  };

  useEffect(() => {
    fetchApiKeyInfo();
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, profile: true }));
    
    const result = await updateProfile(profileData);
    
    if (result.success) {
      toast.success('Profile updated successfully');
    }
    
    setLoading(prev => ({ ...prev, profile: false }));
  };

  // Reveal API key
  const revealApiKey = async () => {
    try {
      setLoading(prev => ({ ...prev, apiKey: true }));
      const response = await axios.post('/users/me/api-key/reveal');
      setApiKeyData(prev => ({
        ...prev,
        fullKey: response.data.apiKey
      }));
      setShowApiKey(true);
      toast.success('API key revealed');
    } catch (error) {
      console.error('Failed to reveal API key:', error);
      toast.error('Failed to reveal API key');
    } finally {
      setLoading(prev => ({ ...prev, apiKey: false }));
    }
  };

  // Copy API key to clipboard
  const copyApiKey = async () => {
    if (!apiKeyData?.fullKey) {
      await revealApiKey();
      return;
    }
    
    try {
      await navigator.clipboard.writeText(apiKeyData.fullKey);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  // Regenerate API key
  const regenerateApiKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate your API key? This will invalidate the current key and you will need to update your devices.')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, regenerate: true }));
      const response = await axios.post('/users/me/api-key/regenerate');
      setApiKeyData(prev => ({
        ...prev,
        masked: response.data.newApiKey.substring(0, 8) + '*'.repeat(response.data.newApiKey.length - 12) + response.data.newApiKey.substring(response.data.newApiKey.length - 4),
        fullKey: response.data.newApiKey,
        lastUsed: null
      }));
      setShowApiKey(true);
      toast.success('API key regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      toast.error('Failed to regenerate API key');
    } finally {
      setLoading(prev => ({ ...prev, regenerate: false }));
    }
  };

  // Arduino code example
  const arduinoCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiKey = "${apiKeyData?.fullKey || 'YOUR_API_KEY_HERE'}";
const char* serverURL = "http://your-server.com/api/data";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void sendAirQualityData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);
    
    // Replace with actual sensor readings
    StaticJsonDocument<300> doc;
    doc["deviceId"] = "AIR-SENSOR-001";
    doc["pm25"] = 15.2;
    doc["pm10"] = 22.8;
    doc["temperature"] = 23.5;
    doc["humidity"] = 65.2;
    doc["co2"] = 450;
    doc["voc"] = 0.8;
    doc["aqi"] = 58;
    doc["batteryLevel"] = 92;
    doc["signalStrength"] = WiFi.RSSI();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(httpResponseCode);
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  }
}

void loop() {
  sendAirQualityData();
  delay(60000); // Send data every minute
}`;

  // MicroPython code example
  const micropythonCode = `import network
import urequests
import ujson
import time
from machine import Pin

# WiFi Configuration
ssid = 'YOUR_WIFI_SSID'
password = 'YOUR_WIFI_PASSWORD'

# API Configuration
api_key = '${apiKeyData?.fullKey || 'YOUR_API_KEY_HERE'}'
server_url = 'http://your-server.com/api/data'

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    
    while not wlan.isconnected():
        print('Connecting to WiFi...')
        time.sleep(1)
    
    print('Connected to WiFi')
    print('Network config:', wlan.ifconfig())

def send_air_quality_data():
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': api_key
    }
    
    # Replace with actual sensor readings
    data = {
        'deviceId': 'AIR-SENSOR-001',
        'pm25': 15.2,
        'pm10': 22.8,
        'temperature': 23.5,
        'humidity': 65.2,
        'co2': 450,
        'voc': 0.8,
        'aqi': 58,
        'batteryLevel': 92,
        'signalStrength': -45
    }
    
    try:
        response = urequests.post(
            server_url,
            data=ujson.dumps(data),
            headers=headers
        )
        
        print('Response:', response.status_code)
        print('Data:', response.text)
        response.close()
        
    except Exception as e:
        print('Error sending data:', e)

def main():
    connect_wifi()
    
    while True:
        send_air_quality_data()
        time.sleep(60)  # Send data every minute

if __name__ == '__main__':
    main()`;

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <motion.div 
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="user-avatar-large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h1>{user?.name}</h1>
            <p className="user-email">{user?.email}</p>
            <div className="user-badges">
              <span className={`role-badge ${user?.role}`}>
                <Shield size={14} />
                {user?.role}
              </span>
              <span className="join-date">
                <Calendar size={14} />
                Member since {new Date(user?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          Profile Settings
        </button>
        <button 
          className={`tab-button ${activeTab === 'api-key' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-key')}
        >
          <Key size={18} />
          API Key Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'integration' ? 'active' : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          <Code size={18} />
          Device Integration
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <motion.div 
            className="profile-section glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-header">
              <h2>Profile Settings</h2>
              <p>Update your account information</p>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input
                      type="text"
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
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
                    <Mail className="input-icon" size={20} />
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="glass-input"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <motion.button
                type="submit"
                className="save-button glass-button"
                disabled={loading.profile}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading.profile ? (
                  <RefreshCw className="spinning" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {loading.profile ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* API Key Management Tab */}
        {activeTab === 'api-key' && (
          <motion.div 
            className="api-key-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass-card">
              <div className="section-header">
                <h2>Device API Key Management</h2>
                <p>Secure key for IoT device authentication</p>
              </div>
              
              {apiKeyData && (
                <div className="api-key-content">
                  <div className="api-key-display">
                    <div className="key-field">
                      <label>API Key</label>
                      <div className="key-input-wrapper">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={showApiKey ? apiKeyData.fullKey || apiKeyData.masked : apiKeyData.masked}
                          readOnly
                          className="key-input glass-input"
                        />
                        <div className="key-actions">
                          <motion.button
                            type="button"
                            className="key-action-button"
                            onClick={() => showApiKey ? setShowApiKey(false) : revealApiKey()}
                            disabled={loading.apiKey}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title={showApiKey ? 'Hide API Key' : 'Reveal API Key'}
                          >
                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </motion.button>
                          <motion.button
                            type="button"
                            className="key-action-button"
                            onClick={copyApiKey}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Copy API Key"
                          >
                            <Copy size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="key-info">
                      <div className="info-item">
                        <span className="info-label">Last Used:</span>
                        <span className="info-value">
                          {apiKeyData.lastUsed ? 
                            new Date(apiKeyData.lastUsed).toLocaleString() : 
                            'Never'
                          }
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className={`info-value status ${apiKeyData.status}`}>
                          <Activity size={14} />
                          {apiKeyData.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="key-actions-section">
                    <motion.button
                      className="regenerate-button danger-button"
                      onClick={regenerateApiKey}
                      disabled={loading.regenerate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading.regenerate ? (
                        <RefreshCw className="spinning" size={18} />
                      ) : (
                        <RefreshCw size={18} />
                      )}
                      {loading.regenerate ? 'Regenerating...' : 'Generate New Key'}
                    </motion.button>
                    
                    <div className="warning-text">
                      <p>⚠️ Regenerating your API key will invalidate the current key. You will need to update all your IoT devices with the new key.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Device Integration Tab */}
        {activeTab === 'integration' && (
          <motion.div 
            className="integration-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass-card">
              <div className="section-header">
                <h2>Device Integration Examples</h2>
                <p>Ready-to-use code snippets for your IoT devices</p>
              </div>
              
              <div className="code-examples">
                {/* Arduino Example */}
                <div className="code-section">
                  <div className="code-header">
                    <div className="code-title">
                      <Smartphone size={20} />
                      <h3>Arduino (C++)</h3>
                    </div>
                    <button 
                      className="download-button glass-button"
                      onClick={() => {
                        const blob = new Blob([arduinoCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'air_quality_sensor.ino';
                        link.click();
                        URL.revokeObjectURL(url);
                        toast.success('Arduino code downloaded');
                      }}
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                  <div className="code-wrapper">
                    <SyntaxHighlighter 
                      language="cpp" 
                      style={atomDark}
                      customStyle={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(100, 255, 218, 0.2)',
                        borderRadius: '8px'
                      }}
                    >
                      {arduinoCode}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* MicroPython Example */}
                <div className="code-section">
                  <div className="code-header">
                    <div className="code-title">
                      <Code size={20} />
                      <h3>MicroPython</h3>
                    </div>
                    <button 
                      className="download-button glass-button"
                      onClick={() => {
                        const blob = new Blob([micropythonCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'air_quality_sensor.py';
                        link.click();
                        URL.revokeObjectURL(url);
                        toast.success('MicroPython code downloaded');
                      }}
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                  <div className="code-wrapper">
                    <SyntaxHighlighter 
                      language="python" 
                      style={atomDark}
                      customStyle={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(100, 255, 218, 0.2)',
                        borderRadius: '8px'
                      }}
                    >
                      {micropythonCode}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;