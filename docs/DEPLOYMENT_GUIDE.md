\# ============================================

\# FILE: docs/DEPLOYMENT\_GUIDE.md

\# ============================================

\# Deployment Guide - Fundraising Portal



\## Overview



This guide covers deploying the Fundraising Portal to production using:

\- \*\*Frontend\*\*: Vercel

\- \*\*Backend\*\*: Railway

\- \*\*Database\*\*: Railway PostgreSQL



---



\## Prerequisites



1\. GitHub account with repository

2\. Vercel account (\[vercel.com](https://vercel.com))

3\. Railway account (\[railway.app](https://railway.app))

4\. Git installed locally



---



\## Part 1: Database Setup (Railway)



\### Step 1: Create PostgreSQL Database



1\. Login to \[Railway](https://railway.app)

2\. Click "New Project"

3\. Select "Provision PostgreSQL"

4\. Wait for database to provision

5\. Click on PostgreSQL service

6\. Go to "Variables" tab

7\. Copy `DATABASE\_URL` (you'll need this)



\### Step 2: Run Migrations



\*\*Option A: Using psql locally\*\*

```bash

\# Connect to Railway database

psql $DATABASE\_URL



\# Run schema

\\i database/schema.sql



\# Exit

\\q

```



\*\*Option B: Using Railway CLI\*\*

```bash

\# Install Railway CLI

npm install -g @railway/cli



\# Login

railway login



\# Link project

railway link



\# Run migrations

railway run psql < database/schema.sql

```



---



\## Part 2: Backend Deployment (Railway)



\### Step 1: Create Backend Service



1\. In Railway dashboard, click "New"

2\. Select "GitHub Repo"

3\. Connect your repository

4\. Railway will auto-detect Node.js



\### Step 2: Configure Build Settings



1\. Click on backend service

2\. Go to "Settings" → "Build"

3\. Set:

&nbsp;  - \*\*Root Directory\*\*: `/backend`

&nbsp;  - \*\*Build Command\*\*: `npm install`

&nbsp;  - \*\*Start Command\*\*: `npm start`



\### Step 3: Add Environment Variables



Go to "Variables" tab and add:



```env

NODE\_ENV=production

PORT=5000

DATABASE\_URL=${{Postgres.DATABASE\_URL}}

JWT\_SECRET=your\_super\_secret\_production\_key\_change\_this

JWT\_EXPIRE=7d

EMAIL\_SERVICE=gmail

EMAIL\_USER=your-production-email@gmail.com

EMAIL\_PASSWORD=your-app-password

FRONTEND\_URL=https://your-frontend.vercel.app

RATE\_LIMIT\_WINDOW\_MS=900000

RATE\_LIMIT\_MAX\_REQUESTS=100

```



\*\*Important\*\*: Generate a strong JWT\_SECRET:

```bash

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

```



\### Step 4: Deploy



1\. Click "Deploy"

2\. Wait for deployment (2-3 mins)

3\. Copy your backend URL (e.g., `https://your-backend.up.railway.app`)



\### Step 5: Test Backend



```bash

curl https://your-backend.up.railway.app/api/health

```



Should return:

```json

{

&nbsp; "success": true,

&nbsp; "message": "Server is healthy"

}

```



---



\## Part 3: Frontend Deployment (Vercel)



\### Step 1: Connect Repository



1\. Login to \[Vercel](https://vercel.com)

2\. Click "Add New" → "Project"

3\. Import your GitHub repository

4\. Select the repository



\### Step 2: Configure Build Settings



1\. \*\*Framework Preset\*\*: Vite

2\. \*\*Root Directory\*\*: `frontend`

3\. \*\*Build Command\*\*: `npm run build`

4\. \*\*Output Directory\*\*: `dist`



\### Step 3: Add Environment Variables



Click "Environment Variables" and add:



```env

VITE\_API\_BASE\_URL=https://your-backend.up.railway.app/api

VITE\_APP\_NAME=Fundraising Portal

VITE\_APP\_VERSION=1.0.0

```



\### Step 4: Deploy



1\. Click "Deploy"

2\. Wait for build (2-3 mins)

3\. Vercel will provide your URL (e.g., `https://your-project.vercel.app`)



\### Step 5: Update Backend CORS



Go back to Railway backend → Variables:

```env

FRONTEND\_URL=https://your-project.vercel.app

```



Redeploy backend for changes to take effect.



---



\## Part 4: Custom Domain (Optional)



\### For Frontend (Vercel)



1\. Go to Project Settings → Domains

2\. Add your custom domain (e.g., `fundraising.com`)

3\. Update DNS records as instructed by Vercel

4\. Wait for SSL certificate (automatic)



\### For Backend (Railway)



1\. Go to Service Settings → Networking

2\. Add custom domain (e.g., `api.fundraising.com`)

3\. Update DNS records as instructed

4\. SSL certificate auto-generated



---



\## Part 5: CI/CD Setup (GitHub Actions)



\### Step 1: Add GitHub Secrets



Go to your GitHub repo → Settings → Secrets and variables → Actions



Add these secrets:

\- `VERCEL\_TOKEN`: Get from \[Vercel Account Settings](https://vercel.com/account/tokens)

\- `VERCEL\_ORG\_ID`: Found in Vercel project settings

\- `VERCEL\_PROJECT\_ID`: Found in Vercel project settings

\- `DATABASE\_URL`: Your Railway PostgreSQL URL

\- `JWT\_SECRET`: Your production JWT secret



\### Step 2: Verify Workflows



Your workflows in `.github/workflows/` should already be set up.



Test by:

```bash

git checkout -b test-deployment

git push origin test-deployment

\# Create PR to main

```



CI/CD will automatically:

\- Run tests

\- Deploy to production on merge to main



---



\## Part 6: Monitoring \& Logging



\### Railway Logs



1\. Go to Railway dashboard

2\. Click on service

3\. View "Deployments" → "Logs"



\### Vercel Logs



1\. Go to Vercel dashboard

2\. Click on project

3\. View "Deployments" → Select deployment → "Logs"



\### Setup Uptime Monitoring



Use services like:

\- \[UptimeRobot](https://uptimerobot.com) (Free)

\- \[Pingdom](https://www.pingdom.com)



Monitor:

\- `https://your-backend.railway.app/api/health`

\- `https://your-frontend.vercel.app`



---



\## Part 7: SSL/HTTPS (Automatic)



Both Railway and Vercel provide automatic SSL certificates.



Verify:

```bash

curl -I https://your-backend.railway.app/api/health

\# Should show: HTTP/2 200



curl -I https://your-frontend.vercel.app

\# Should show: HTTP/2 200

```



---



\## Part 8: Database Backups



\### Automatic Backups (Railway)



Railway PostgreSQL includes automatic daily backups.



\### Manual Backup



```bash

\# Backup

pg\_dump $DATABASE\_URL > backup\_$(date +%Y%m%d).sql



\# Restore

psql $DATABASE\_URL < backup\_20251024.sql

```



\### Scheduled Backups (Recommended)



Create a GitHub Action:



```yaml

\# .github/workflows/backup.yml

name: Database Backup



on:

&nbsp; schedule:

&nbsp;   - cron: '0 2 \* \* \*'  # Daily at 2 AM



jobs:

&nbsp; backup:

&nbsp;   runs-on: ubuntu-latest

&nbsp;   steps:

&nbsp;     - name: Backup database

&nbsp;       run: |

&nbsp;         pg\_dump ${{ secrets.DATABASE\_URL }} > backup.sql

&nbsp;     # Upload to S3 or Google Drive

```



---



\## Troubleshooting



\### Backend won't start

\- Check Railway logs

\- Verify environment variables

\- Ensure DATABASE\_URL is correct



\### Frontend can't connect to backend

\- Verify VITE\_API\_BASE\_URL

\- Check CORS settings in backend

\- Test backend health endpoint



\### Database connection errors

\- Check DATABASE\_URL format

\- Verify database is running in Railway

\- Check IP whitelist settings



---



\## Post-Deployment Checklist



\- \[ ] Backend health endpoint returns 200

\- \[ ] Frontend loads without errors

\- \[ ] User can register and login

\- \[ ] Events can be created

\- \[ ] Pledges can be submitted

\- \[ ] Admin panel accessible

\- \[ ] HTTPS enabled on both services

\- \[ ] Environment variables set correctly

\- \[ ] CI/CD pipeline working

\- \[ ] Monitoring setup

\- \[ ] Backups configured



---



\## Scaling (Future)



\### When to scale:

\- Response time > 3 seconds

\- CPU usage consistently > 80%

\- Database connections maxed out



\### How to scale:



\*\*Railway:\*\*

\- Upgrade plan for more resources

\- Enable horizontal scaling



\*\*Vercel:\*\*

\- Automatic scaling (built-in)



\*\*Database:\*\*

\- Upgrade PostgreSQL plan

\- Add read replicas

\- Implement caching (Redis)



---



Last Updated: October 24, 2025

