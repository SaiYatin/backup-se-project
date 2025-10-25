# ✅ scripts/setup.sh
#!/bin/bash
set -e

echo "🚀 Setting up Fundraising Portal..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL 15+"
    exit 1
fi

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend
npm install
cp .env.example .env
cd ..

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cp .env.example .env
cd ..

# Database setup
echo "🗄️ Setting up database..."
createdb fundraising_db || echo "Database already exists"
psql -d fundraising_db -f database/schema.sql

# Seed data
echo "🌱 Seeding database..."
node database/seed-data.js

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"