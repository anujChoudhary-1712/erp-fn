#!/bin/bash

# ERP Frontend - Next.js Build Script
# Creates production build without exposing source code

echo "🚀 Building ERP Frontend (Next.js)"
echo "=================================="

# Create build directory
BUILD_DIR="erp-frontend-production"

echo "📁 Creating build structure..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Build Next.js for production
echo "⚡ Building Next.js production build..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Build failed! Make sure 'npm run build' works in your project."
    exit 1
fi

# Copy production files (NO source code)
echo "📋 Copying production files..."
cp -r .next "$BUILD_DIR/"
cp -r public "$BUILD_DIR/" 2>/dev/null || echo "No public directory found"
cp package.json "$BUILD_DIR/"
cp package-lock.json "$BUILD_DIR/" 2>/dev/null || echo "No package-lock.json found"
cp next.config.js "$BUILD_DIR/" 2>/dev/null || echo "No next.config.js found"

# Copy only production dependencies
cd "$BUILD_DIR"

# Create production package.json (only runtime dependencies)
echo "📋 Creating production package.json..."
cat > package.json << 'EOF'
{
  "name": "erp-frontend-production",
  "version": "1.0.0",
  "description": "ERP Frontend - Production Build",
  "private": true,
  "scripts": {
    "start": "next start -p 3000",
    "start:production": "NODE_ENV=production next start -p 3000"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
EOF

# Create required runtime directories
mkdir -p logs

# Install only production dependencies
echo "📦 Installing production dependencies..."
npm install --production

# Create environment configuration
echo "⚙️ Creating environment configuration..."
cat > .env.production << 'EOF'
# Frontend Production Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# API Configuration (Update these)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics, etc.
# NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
EOF

# Create installation scripts
echo "⚙️ Creating installation scripts..."

# Windows batch file
cat > install.bat << 'EOF'
@echo off
echo ERP Frontend Installation
echo =========================
echo.
echo Installing production dependencies...
npm install --production
echo.
echo ================================
echo Installation Complete!
echo ================================
echo.
echo Configuration:
echo 1. Edit .env.production file to update API URLs
echo 2. Update NEXT_PUBLIC_API_URL to your backend URL
echo.
echo Start Options:
echo . For Development/Testing: start-frontend.bat
echo . For Production 24/7: start-frontend-24x7.bat
echo.
echo Default URLs:
echo . Frontend: http://localhost:3000
echo . Ensure backend is running on: http://localhost:5000
echo.
pause
EOF

# Linux/Mac installation script
cat > install.sh << 'EOF'
#!/bin/bash
echo "ERP Frontend Installation"
echo "========================"
echo ""
echo "Installing production dependencies..."
npm install --production
echo ""
echo "Setting permissions..."
chmod +x start-frontend.sh
chmod +x start-frontend-24x7.sh
echo ""
echo "================================"
echo "Installation Complete!"
echo "================================"
echo ""
echo "Configuration:"
echo "1. Edit .env.production file to update API URLs"
echo "2. Update NEXT_PUBLIC_API_URL to your backend URL"
echo ""
echo "Start Options:"
echo "• Development/Testing: ./start-frontend.sh"
echo "• Production 24/7: ./start-frontend-24x7.sh"
echo ""
echo "Default URLs:"
echo "• Frontend: http://localhost:3000"
echo "• Ensure backend is running on: http://localhost:5000"
echo ""
EOF

chmod +x install.sh

# Create startup scripts
echo "⚙️ Creating startup scripts..."

# Linux/Mac startup script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting ERP Frontend..."
echo "=========================="
echo ""
echo "Frontend will be available at:"
echo "- Local: http://localhost:3000"
echo "- Network: http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Next.js in production mode
NODE_ENV=production npm start
EOF

chmod +x start-frontend.sh

# Windows startup script
cat > start-frontend.bat << 'EOF'
@echo off
echo 🚀 Starting ERP Frontend...
echo ==========================
echo.
echo Frontend will be available at:
echo - Local: http://localhost:3000
echo - Network: Check your local IP
echo.
echo Press Ctrl+C to stop the server
echo.

set NODE_ENV=production
npm start
pause
EOF

# PM2 startup script for 24/7 operation
cat > start-frontend-24x7.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting ERP Frontend 24/7 with PM2..."
echo "========================================"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Stop existing frontend process if running
pm2 delete erp-frontend 2>/dev/null || echo "No existing frontend process found"

# Start with PM2
echo "🔄 Starting frontend with PM2..."
NODE_ENV=production pm2 start npm --name "erp-frontend" -- start

# Enable auto-restart on system reboot
echo "⚙️ Configuring auto-restart on system boot..."
pm2 startup

# Save current PM2 configuration
pm2 save

echo ""
echo "✅ Frontend started successfully!"
echo "================================"
echo ""
echo "🌐 Access URLs:"
echo "- Local: http://localhost:3000"
echo "- Network: http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):3000"
echo ""
echo "📊 PM2 Management Commands:"
echo "- Check status: pm2 status"
echo "- View logs: pm2 logs erp-frontend"
echo "- Restart: pm2 restart erp-frontend"
echo "- Stop: pm2 stop erp-frontend"
echo "- Monitor: pm2 monit"
echo ""
EOF

chmod +x start-frontend-24x7.sh

# Create comprehensive README
cat > README.md << 'EOF'
# ERP Frontend - Production Distribution

This package contains the production build of the ERP Frontend (Next.js).
**Source code is compiled and protected** - only production build is distributed.

## Quick Start

### 1. Installation
```bash
./install.sh