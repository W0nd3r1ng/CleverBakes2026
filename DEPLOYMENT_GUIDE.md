# CleverBakes Deployment Guide
## MongoDB Atlas + Render.com (All Free)

---

## STEP 1: Set Up MongoDB Atlas (Free - M0 Cluster)

### 1.1 Create Account
1. Go to **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with Google or email (it's free)
3. Choose **"Shared" (FREE)** cluster tier

### 1.2 Create Free Cluster
1. Click **"Build a Database"**
2. Select **M0 FREE** tier
3. Choose region closest to you (e.g., Singapore for Philippines)
4. Cluster name: `CleverBakes` (or default)
5. Click **"Create Cluster"** (takes 1-3 minutes)

### 1.3 Set Up Database Access
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Username: `cleverbakes`
5. Password: Create a strong password (SAVE THIS!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Set Up Network Access
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
   - This is needed for Render.com to connect
4. Click **"Confirm"**

### 1.5 Get Your Connection String
1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: Python, Version: 3.12+
5. Copy the connection string. It looks like:
   ```
   mongodb+srv://cleverbakes:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password from step 1.3
7. **SAVE THIS** — you'll need it for Render

---

## STEP 2: Deploy Backend to Render.com

### 2.1 Create Render Account
1. Go to **https://render.com**
2. Sign up with GitHub (recommended — makes deployment easier)

### 2.2 Push Code to GitHub First
- Use the **"Save to GitHub"** button in Emergent chat input
- Or download the zip and push manually to your repo: `https://github.com/W0nd3r1ng/CleverBakes2026.git`

### 2.3 Create Backend Web Service
1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repo (`CleverBakes2026`)
3. Configure:
   - **Name**: `cleverbakes-api`
   - **Region**: Singapore (closest to PH)
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
   - **Health Check Path**: `/api/health`

4. Click **"Advanced"** → **"Add Environment Variable"**:

   | Key | Value |
   |-----|-------|
   | `MONGO_URL` | `mongodb+srv://cleverbakes:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority` |
   | `DB_NAME` | `cleverbakes` |
   | `CORS_ORIGINS` | `https://cleverbakes-frontend.onrender.com` (you'll update this after creating frontend) |

5. Click **"Create Web Service"**
6. Wait for build (2-5 minutes)
7. Your API URL will be: `https://cleverbakes-api.onrender.com`
8. Test: Visit `https://cleverbakes-api.onrender.com/api/health` — should show `{"status":"ok"}`

---

## STEP 3: Deploy Frontend to Render.com

### 3.1 Create Static Site
1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect same GitHub repo (`CleverBakes2026`)
3. Configure:
   - **Name**: `cleverbakes-frontend`
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: `cd frontend && yarn install && yarn build`
   - **Publish Directory**: `frontend/build`

4. Click **"Advanced"** → **"Add Environment Variable"**:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_BACKEND_URL` | `https://cleverbakes-api.onrender.com` |

5. Add **Rewrite Rule** (for React Router):
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite

6. Click **"Create Static Site"**
7. Wait for build (3-5 minutes)
8. Your site URL: `https://cleverbakes-frontend.onrender.com`

---

## STEP 4: Update CORS (Important!)

1. Go back to your **Backend Web Service** on Render
2. Go to **"Environment"** tab
3. Update `CORS_ORIGINS` to your actual frontend URL:
   ```
   https://cleverbakes-frontend.onrender.com
   ```
4. Click **"Save Changes"** — backend will auto-redeploy

---

## STEP 5: Verify Everything Works

1. Visit your frontend URL: `https://cleverbakes-frontend.onrender.com`
2. Check products load on the menu
3. Go to `/admin/login` → login with `admin` / `cleverbakes2025`
4. Try placing a test order
5. Track the order at `/track`

---

## Custom Domain (Optional)

### For a custom domain like `cleverbakes.com`:
1. Buy a domain (e.g., from Namecheap, GoDaddy, or Porkbun)
2. In Render → your Static Site → **"Custom Domains"**
3. Add your domain
4. Update DNS records at your domain registrar:
   - Type: CNAME
   - Host: www (or @)
   - Value: `cleverbakes-frontend.onrender.com`
5. Render provides free SSL automatically

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Products not loading" | Check CORS_ORIGINS matches your frontend URL exactly |
| "Build failed" on frontend | Make sure `REACT_APP_BACKEND_URL` doesn't have trailing slash |
| "Cannot connect to database" | Check MONGO_URL password has no special chars like `@` `#` (URL-encode them) |
| "Free tier sleeps" | Render free tier sleeps after 15 min inactivity. First load may take 30-60 seconds |
| "Login not working" | Make sure cookies work (HTTPS required) — Render provides HTTPS by default |

---

## Important Notes About Free Tier

- **Render Free**: Sleeps after 15 min of inactivity. First request after sleep takes ~30 seconds (cold start)
- **MongoDB Atlas M0**: Limited to 512MB storage, 500 connections (more than enough for a small bakery)
- **No credit card required** for either service
- Both services auto-deploy when you push new code to GitHub

---

## Admin Access
- **URL**: `https://your-frontend-url.onrender.com/admin/login`
- **Username**: `admin`
- **Password**: `cleverbakes2025`

## Seeded Voucher Codes (for testing)
- `WELCOME10` — 10% off, minimum order ₱500
- `SAVE50` — ₱50 off, minimum order ₱300
