# CleverBakes - Bakery Ordering Platform

## Admin Credentials
- **Username:** `admin`
- **Password:** `cleverbakes2025`
- **Login URL:** `/admin/login`

## Tech Stack
- **Backend:** Python FastAPI + MongoDB
- **Frontend:** React + TailwindCSS
- **Database:** MongoDB

## Features
- Landing page with Hero, About, Menu, Testimonials, Contact
- Product categories (Cakes, Cookies, Breads & Pastries, Brownies)
- Best Sellers highlighted section
- GCash payment (manual upload proof) + COD
- Order tracking via 6-digit number
- FB Messenger order redirect
- Admin dashboard: Products, Categories, Orders, Reviews management
- Order status tracking (Pending > Confirmed > Preparing > Ready > Completed)
- Payment status management (Pending / Paid / Refunded)

---

## How to Deploy (Free Options)

### Option 1: Render.com (Recommended - Free Tier)

**Backend:**
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn server:app --host 0.0.0.0 --port 10000`
5. Add Environment Variables:
   - `MONGO_URL` = your MongoDB Atlas connection string
   - `DB_NAME` = `cleverbakes`
6. Deploy

**Frontend:**
1. On Render → New → Static Site
2. Settings:
   - Build Command: `cd frontend && yarn install && yarn build`
   - Publish Directory: `frontend/build`
3. Add Environment Variable:
   - `REACT_APP_BACKEND_URL` = your backend Render URL (e.g., `https://cleverbakes-api.onrender.com`)
4. Deploy

### Option 2: Vercel (Frontend) + Render (Backend)

**Frontend on Vercel:**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Set Root Directory to `frontend`
4. Add env: `REACT_APP_BACKEND_URL` = your backend URL
5. Deploy

**Backend on Render:** Same as Option 1 above

### Option 3: Railway.app

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add MongoDB plugin (or use MongoDB Atlas)
4. Set environment variables
5. Deploy both services

---

## MongoDB Setup (Atlas - Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for all)
5. Get connection string: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net`
6. Use this as `MONGO_URL` env variable

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb+srv://your-connection-string
DB_NAME=cleverbakes
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn install
yarn start
```
