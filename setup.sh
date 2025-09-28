#!/bin/bash

echo "🚀 Setting up Ultimate Full-Stack MERN IoT Air Quality Dashboard"
echo "================================================================="
echo "   🌬️  Modern Glassmorphism UI with React Three Fiber 3D Visualizations"
echo "   🤖  AI-Powered Chat Assistant with OpenRouter Integration"
echo "   📊  Real-time IoT Data Processing with Dual Authentication"
echo "   🔐  JWT for Web Users + API Keys for IoT Devices"
echo "================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION'))" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js 16+ and try again."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if MongoDB is running
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB and try again."
    echo "   macOS: brew services start mongodb/brew/mongodb-community"
    echo "   Ubuntu: sudo systemctl start mongod"
    echo "   Windows: net start MongoDB"
    exit 1
fi

echo "✅ MongoDB is running"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"

# Go back to root directory
cd ..

# Create .env files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp backend/.env backend/.env.example 2>/dev/null || echo "⚠️  Please manually create backend/.env file"
fi

if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend .env.local file..."
    cp frontend/.env.local frontend/.env.local.example 2>/dev/null || echo "⚠️  Please manually create frontend/.env.local file"
fi

# Seed the database
echo "🌱 Seeding the database with initial data..."
cd backend
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed the database"
    exit 1
fi

echo "✅ Database seeded successfully"

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend && npm start"
echo ""
echo "3. Alternative - Start both with concurrently from root:"
echo "   npm run dev"
echo ""
echo "4. Open your browser and navigate to:"
echo "   http://localhost:3000"
echo ""
echo "🔑 Login credentials:"
echo "   Admin: admin@company.com / admin123"
echo "   User:  john.doe@company.com / user123"
echo ""
echo "📊 Postman Collection:"
echo "   Import: postman/IoT_Dashboard_V3_Complete.postman_collection.json"
echo ""
echo "🤖 AI Helper Features:"
echo "   - OpenRouter integration with Gemini 2.0 Flash"
echo "   - Environmental data analysis and recommendations"
echo "   - IoT troubleshooting assistance"
echo ""
echo "🌟 Key Features Built:"
echo "   ✅ 3D Air Quality Visualization (React Three Fiber)"
echo "   ✅ Real-time Dashboard with Glassmorphism UI"
echo "   ✅ AI Chat Assistant with OpenRouter"
echo "   ✅ Profile Management with API Key Integration"
echo "   ✅ Admin User Management Panel"
echo "   ✅ API Logs & Analytics Dashboard"
echo "   ✅ Arduino & MicroPython Code Examples"
echo "   ✅ Dual Authentication (JWT + API Keys)"
echo "   ✅ Complete Postman Collection"
echo ""
echo "🔧 Environment Variables:"
echo "   Backend:  backend/.env"
echo "   Frontend: frontend/.env.local (includes OpenRouter API key)"
echo ""
echo "Happy coding! 🚀✨"