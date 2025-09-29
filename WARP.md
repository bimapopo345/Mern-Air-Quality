# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Full-Stack MERN application for monitoring IoT air quality data with a glassmorphism UI design. It features dual authentication (JWT for web users, API keys for IoT devices) and real-time data visualization.

## Common Development Commands

### Quick Start - Run Both Frontend & Backend
```bash
# From project root - starts both servers concurrently
npm run dev
```

### Backend Development
```bash
# Start backend development server (with nodemon)
cd backend && npm run dev

# Start production server
cd backend && npm start

# Seed database with initial data
cd backend && npm run seed
```

### Frontend Development
```bash
# Start React development server
cd frontend && npm start

# Build for production
cd frontend && npm run build

# Run tests
cd frontend && npm test
```

### Installation & Setup
```bash
# Install all dependencies (root, backend, and frontend)
npm run install-all

# Or manually install each
npm install
cd backend && npm install
cd ../frontend && npm install
```

## High-Level Architecture

### Tech Stack
- **Frontend**: React 18 with React Router v6, Framer Motion for animations, React Three Fiber for 3D visualizations
- **Backend**: Node.js/Express with MongoDB/Mongoose
- **Authentication**: Dual system - JWT tokens for web users, API keys for IoT devices
- **Real-time Communication**: RESTful API with axios

### Authentication Flow

The application uses two authentication systems:

1. **Web Users (JWT)**
   - Login via `/api/auth/login` with email/password
   - JWT stored in localStorage with 24-hour expiry
   - Token included in Authorization header: `Bearer <token>`
   - Middleware: `authenticateToken` in `backend/middleware/auth.js`

2. **IoT Devices (API Key)**
   - API key stored in User model
   - Sent via `X-API-Key` header
   - Middleware: `authenticateDevice` in `backend/middleware/auth.js`
   - Users can regenerate keys via `/api/users/me/api-key`

### Database Schema

**User Model** (`backend/models/User.js`)
- Stores user credentials, profile, and API keys
- Includes role-based access (admin/user)

**AirQualityData Model** (`backend/models/AirQualityData.js`)
- IoT sensor readings with owner reference
- Includes AQI calculations and air quality categories
- Virtual fields for computed values

**ApiLog Model** (`backend/models/ApiLog.js`)
- Tracks all API requests for monitoring
- Used by admin dashboard for analytics

### API Architecture

All API routes are prefixed with `/api/`:

- `/api/auth/*` - Authentication endpoints (login, register, validate-token)
- `/api/data/*` - IoT data endpoints (submit, retrieve, charts, latest)
- `/api/users/*` - User profile and API key management
- `/api/admin/*` - Admin-only endpoints (user management, logs)

### Frontend Routing Structure

The frontend uses React Router with protected routes:

- `/login` - Public login page
- `/dashboard` - Main dashboard with data visualizations
- `/profile` - User profile and API key management
- `/ai-helper` - AI assistant with OpenRouter integration
- `/admin/users` - User management (admin only)
- `/admin/logs` - API logs analytics (admin only)

### State Management

- **Authentication Context** (`frontend/src/contexts/AuthContext.js`): Manages user auth state, login/logout, token validation
- **Theme Context** (`frontend/src/contexts/ThemeContext.js`): Dark/light theme management
- **Axios Interceptors** (`frontend/src/index.js`): Auto-attach auth headers, handle token expiry

### Key API Endpoints

**Data Submission (IoT Devices)**
```
POST /api/data
Headers: X-API-Key: <device-api-key>
Body: { deviceId, pm25, pm10, temperature, humidity, co2, voc, aqi, ... }
```

**Get Latest Data**
```
GET /api/data/latest
Headers: Authorization: Bearer <jwt-token>
Query: ?deviceId=<optional-device-id>
```

**Chart Data**
```
GET /api/data/charts
Headers: Authorization: Bearer <jwt-token>
Query: ?hours=24&type=hourly
```

### Environment Configuration

**Backend** (`backend/.env`):
```
MONGODB_URI=mongodb://localhost:27017/iot-air-quality-dashboard
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_OPENROUTER_API_KEY=sk-or-v1-xxx
```

### Common Issues & Solutions

1. **CORS Errors**: Backend is configured to allow requests from `http://localhost:3000`. Check `backend/server.js` CORS configuration if issues persist.

2. **MongoDB Connection**: Ensure MongoDB is running locally. The app will auto-retry connection every 5 seconds if MongoDB is down.

3. **Missing API Endpoints**: The `/api/data/latest` endpoint exists in the code. If getting 404, ensure backend is running on port 5000 and check console for startup errors.

4. **Authentication Failures**: JWT tokens expire after 24 hours. The frontend has interceptors to handle token expiry and redirect to login.

## Testing Credentials

- **Admin**: `admin@company.com` / `admin123`
- **User**: `john.doe@company.com` / `user123`

## API Testing

Postman collections are available in `postman/` directory:
- `IoT_Dashboard_Testing.postman_collection.json` - Basic testing
- `IoT_Dashboard_V3_Complete.postman_collection.json` - Complete collection

## Code Style & Patterns

- The application follows a standard MERN structure with separation of concerns
- Backend uses middleware pattern for authentication and logging
- Frontend uses custom hooks for data fetching and state management
- All API responses follow consistent format with `message` and `data` fields
- Error handling includes specific error codes for debugging

## Security Features

- JWT tokens with 24-hour expiry
- API key authentication for IoT devices
- Role-based access control (admin/user)
- Request logging for audit trails
- Input validation and sanitization
- Helmet.js for security headers
- Password hashing with bcrypt

## Performance Considerations

- API pagination with max 1000 records per request
- Database indexes on frequently queried fields
- Axios request/response interceptors for efficient token management
- React.memo and useMemo for optimized re-renders
- Lazy loading for 3D visualizations