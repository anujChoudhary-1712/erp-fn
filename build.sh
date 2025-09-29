#!/bin/bash

# Windows Deployment Build Script for ERP Frontend
# Creates production folder structure for C:/ERP/frontend deployment

echo "🏢 Building ERP Frontend for Windows Deployment"
echo "==============================================="

DEPLOY_FOLDER="frontend"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 1. Clean previous build
echo "📁 Cleaning previous build..."
rm -rf "$DEPLOY_FOLDER"
rm -rf .next

# 2. Install dependencies and build
echo "📦 Installing dependencies..."
npm install

echo "⚡ Building Next.js production..."
npm run build

# 3. Check if build succeeded
if [ ! -d ".next" ]; then
    echo "❌ Build failed! No .next folder found."
    exit 1
fi

# 4. Create deployment folder structure
echo "📁 Creating deployment folder structure..."
mkdir -p "$DEPLOY_FOLDER"
mkdir -p "$DEPLOY_FOLDER/logs"

# 5. Copy essential files
echo "📋 Copying production files..."
cp -r .next "$DEPLOY_FOLDER/"
cp -r public "$DEPLOY_FOLDER/" 2>/dev/null || echo "ℹ️ No public directory"
cp next.config.js "$DEPLOY_FOLDER/" 2>/dev/null || echo "ℹ️ No next.config.js"

# 6. Create production package.json (minimal dependencies)
echo "📦 Creating production package.json..."
cat > "$DEPLOY_FOLDER/package.json" << 'EOF'
{
  "name": "erp-frontend",
  "version": "1.0.0",
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

# 7. Create .env.production file
echo "🔧 Creating .env.production..."
cat > "$DEPLOY_FOLDER/.env.production" << 'EOF'
# Frontend Production Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# API Configuration (Update these)
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend Configuration (must match backend CORS settings)
# Make sure backend CORS_ALLOWED_ORIGINS includes: http://localhost:3000

# Optional: Analytics, etc.
# NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
EOF

# 8. Create Windows batch files
echo "🔧 Creating Windows batch files..."

# install.bat
cat > "$DEPLOY_FOLDER/install.bat" << 'EOF'
@echo off
echo Installing ERP Frontend Dependencies...
echo =====================================

npm install --production --legacy-peer-deps

if %errorlevel% neq 0 (
    echo ERROR: Installation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Frontend installation complete!
echo.
echo Next steps:
echo 1. Configure .env.production if needed
echo 2. Run start.bat to test
echo 3. Use PM2 with ecosystem.config.js for production
echo.
pause
EOF

# start.bat
cat > "$DEPLOY_FOLDER/start.bat" << 'EOF'
@echo off
echo Starting ERP Frontend...
echo =======================

if not exist ".next" (
    echo ERROR: No .next build found!
    echo Please ensure the build was successful.
    pause
    exit /b 1
)

echo.
echo Frontend will be available at:
echo - Local: http://localhost:3000
echo - Network: http://%COMPUTERNAME%:3000
echo.
echo Press Ctrl+C to stop the server
echo.

set NODE_ENV=production
npm start
EOF

# 9. Create PM2 ecosystem config
echo "🔧 Creating PM2 ecosystem config..."
cat > "$DEPLOY_FOLDER/ecosystem.frontend.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: "erp-frontend",
      cwd: "C:/ERP/frontend",
      script: "node",
      args: "./node_modules/next/dist/bin/next start -p 3000",
      autorestart: true,
      watch: false,
      out_file: "C:/ERP/frontend/logs/frontend-out.log",
      error_file: "C:/ERP/frontend/logs/frontend-error.log",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
EOF

# 10. Create README for deployment
echo "📖 Creating deployment README..."
cat > "$DEPLOY_FOLDER/README-DEPLOYMENT.md" << 'EOF'
# ERP Frontend - Windows Deployment

## Quick Setup

1. **Extract to Windows:**
   ```
   Copy this folder to: C:/ERP/frontend
   ```

2. **Install Dependencies:**
   ```
   Double-click: install.bat
   ```

3. **Test Run:**
   ```
   Double-click: start.bat
   ```

4. **Production with PM2:**
   ```
   cd C:/ERP
   pm2 start frontend/ecosystem.frontend.config.js
   ```

## File Structure
```
C:/ERP/frontend/
├── .next/                 # Built application
├── logs/                  # Log files
├── .env.production        # Environment config
├── package.json           # Dependencies
├── install.bat           # Installation script
├── start.bat             # Start script
└── ecosystem.frontend.config.js  # PM2 config
```

## Troubleshooting

- **Port 3000 in use:** Change port in ecosystem config
- **Build errors:** Check logs/ folder
- **API connection:** Verify backend is running on port 8001

## URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
EOF

# 11. Make batch files executable (if on Unix-like system)
chmod +x "$DEPLOY_FOLDER"/*.bat 2>/dev/null || true

# 12. Show deployment summary
echo ""
echo "✅ Windows deployment package created!"
echo "======================================"
echo ""
echo "📁 Folder: $DEPLOY_FOLDER"
echo "📊 Size: $(du -sh $DEPLOY_FOLDER | cut -f1)"
echo ""
echo "📋 Contents:"
ls -la "$DEPLOY_FOLDER"
echo ""
echo "🚀 Ready for Windows deployment:"
echo "   1. Copy '$DEPLOY_FOLDER' folder to C:/ERP/ on Windows"
echo "   2. Run install.bat to install dependencies"
echo "   3. Use PM2 ecosystem config for production"
echo ""
echo "📁 Expected Windows path: C:/ERP/frontend/"