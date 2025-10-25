# ✅ scripts/deploy.sh
#!/bin/bash
set -e

echo "🚀 Deploying to production..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Deploy backend (Railway)
echo "🚂 Deploying backend to Railway..."
railway up --service backend

# Deploy frontend (Vercel)
echo "▲ Deploying frontend to Vercel..."
cd frontend
vercel --prod
cd ..

echo "✅ Deployment complete!"