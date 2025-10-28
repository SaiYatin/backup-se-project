#!/bin/bash
# ==================================================
# LOCAL SETUP HELPER SCRIPT
# ==================================================
# This script helps configure your local environment

echo "🚀 Fundraising Portal - Local Setup Helper"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate JWT secret
generate_jwt_secret() {
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
}

# ============================================
# Step 1: Check Prerequisites
# ============================================
echo "📋 Step 1: Checking Prerequisites"
echo "=================================="
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found!"
    echo "   Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found!"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    PG_VERSION=$(psql --version)
    echo -e "${GREEN}✓${NC} PostgreSQL installed: $PG_VERSION"
else
    echo -e "${RED}✗${NC} PostgreSQL not found!"
    echo "   Please install PostgreSQL 15+ from https://www.postgresql.org/download/"
    exit 1
fi

# Check if PostgreSQL is running
if pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is running"
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL is not running"
    echo "   Start it with:"
    echo "   - Windows: Check Services → postgresql"
    echo "   - Mac: brew services start postgresql@15"
    echo "   - Linux: sudo systemctl start postgresql"
    exit 1
fi

echo ""
read -p "Press Enter to continue..."
echo ""

# ============================================
# Step 2: Generate JWT Secret
# ============================================
echo "🔐 Step 2: Generating JWT Secret"
echo "================================="
echo ""

JWT_SECRET=$(generate_jwt_secret)
echo "Your JWT Secret (save this):"
echo -e "${GREEN}${JWT_SECRET}${NC}"
echo ""
echo "This will be added to backend/.env automatically"
echo ""
read -p "Press Enter to continue..."
echo ""

# ============================================
# Step 3: Create Database
# ============================================
echo "🗄️  Step 3: Database Setup"
echo "=========================="
echo ""

# Check if database exists
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw fundraising_db; then
    echo -e "${YELLOW}⚠${NC} Database 'fundraising_db' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql -U postgres -c "DROP DATABASE fundraising_db;" 2>/dev/null
        echo -e "${GREEN}✓${NC} Dropped existing database"
    fi
fi

# Create database
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw fundraising_db; then
    psql -U postgres -c "CREATE DATABASE fundraising_db;"
    echo -e "${GREEN}✓${NC} Created database 'fundraising_db'"
else
    echo -e "${GREEN}✓${NC} Database 'fundraising_db' ready"
fi

echo ""
read -p "Press Enter to continue..."
echo ""

# ============================================
# Step 4: Create .env Files
# ============================================
echo "📝 Step 4: Creating Environment Files"
echo "====================================="
echo ""

# Backend .env
cat > backend/.env << EOF
# Backend Environment Variables (Local Setup)
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fundraising_db
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓${NC} Created backend/.env"

# Frontend .env
cat > frontend/.env << EOF
# Frontend Environment Variables (Local Setup)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=FundRaise
VITE_APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✓${NC} Created frontend/.env"
echo ""
read -p "Press Enter to continue..."
echo ""

# ============================================
# Step 5: Install Dependencies
# ============================================
echo "📦 Step 5: Installing Dependencies"
echo "==================================="
echo ""

echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install backend dependencies"
    exit 1
fi
cd ..

echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
read -p "Press Enter to continue..."
echo ""

# ============================================
# Step 6: Setup Database Schema
# ============================================
echo "🏗️  Step 6: Setting Up Database Schema"
echo "======================================"
echo ""

psql -U postgres -d fundraising_db -f database/schema.sql > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database schema created"
else
    echo -e "${YELLOW}⚠${NC} Schema might already exist (this is OK)"
fi

echo ""
read -p "Do you want to seed the database with sample data? (Y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    node database/seed-data.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Database seeded successfully"
    else
        echo -e "${RED}✗${NC} Failed to seed database"
    fi
fi

echo ""

# ============================================
# Step 7: Summary
# ============================================
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📋 Configuration Summary:"
echo "------------------------"
echo "Database: postgresql://postgres:postgres@localhost:5432/fundraising_db"
echo "Backend Port: 5000"
echo "Frontend Port: 5173"
echo "JWT Secret: [GENERATED]"
echo ""
echo "🚀 To Start the Application:"
echo "---------------------------"
echo ""
echo "Option 1 - Manual (2 terminals):"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Option 2 - Use startup script:"
echo "  Linux/Mac: ./start-local.sh"
echo "  Windows: start-local.bat"
echo ""
echo "🌐 URLs:"
echo "-------"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"
echo "API:      http://localhost:5000/api"
echo ""
echo "🔐 Test Credentials (if you seeded database):"
echo "--------------------------------------------"
echo "Admin:     admin@charityfund.com / Admin@123456"
echo "Organizer: organizer1@example.com / Organizer@123"
echo "Donor:     donor1@example.com / Donor@123"
echo ""
echo "📧 Email Configuration (OPTIONAL):"
echo "---------------------------------"
echo "Email features are disabled by default."
echo "To enable email notifications:"
echo "1. Use a Gmail account"
echo "2. Enable 2-Factor Authentication"
echo "3. Create App Password: https://myaccount.google.com/apppasswords"
echo "4. Edit backend/.env and set EMAIL_USER and EMAIL_PASSWORD"
echo ""
echo "🎉 You're all set! Happy coding!"