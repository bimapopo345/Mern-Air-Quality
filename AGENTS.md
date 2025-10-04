# Agent Guidelines for IoT Air Quality Dashboard

## Development Commands
- **Start full stack**: `npm run dev` (runs both backend and frontend)
- **Backend only**: `cd backend && npm run dev` (uses nodemon)
- **Frontend only**: `cd frontend && npm start` (React dev server)
- **Build frontend**: `npm run build`
- **Seed database**: `npm run seed`
- **Run tests**: `cd frontend && npm test` (React Testing Library)
- **Single test**: `cd frontend && npm test -- --testNamePattern="test name"`

## Code Style Guidelines

### Backend (Node.js/Express)
- Use CommonJS require/exports (not ES modules)
- Error handling with try/catch and proper HTTP status codes
- Mongoose schemas with validation, indexes, and timestamps
- JWT authentication with bcrypt for password hashing
- Middleware for logging, CORS, rate limiting, and security
- Environment variables with dotenv

### Frontend (React)
- Functional components with hooks
- ES6+ imports/exports
- React Router for navigation
- Context API for state management (AuthContext, ThemeContext)
- Framer Motion for animations
- Axios for API calls
- CSS modules or separate CSS files
- Lucide React for icons

### Naming Conventions
- **Files**: PascalCase for components (UserProfile.js), camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase, descriptive names
- **Components**: PascalCase

### Import Order
1. React/React Native imports
2. Third-party libraries
3. Internal components (relative imports)
4. Styles/CSS files
5. Utilities/helpers

### Error Handling
- Backend: Global error handler with proper status codes
- Frontend: Try/catch with toast notifications (react-hot-toast)
- API responses: Consistent error format with message and error fields

### Security
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all inputs (backend with validator, frontend with form validation)
- Implement proper authentication and authorization checks