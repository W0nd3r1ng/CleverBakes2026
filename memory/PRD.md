# CleverBakes PRD

## Original Problem Statement
User had an existing bakery ordering site (Vite + React + Netlify functions + NeonDB) that was incomplete. Needed:
- Fix backend/controls issues
- Admin dashboard for product/order/review management
- GCash manual payment + COD options
- Order tracking system (status timeline + customer lookup by order number)
- Keep FB Messenger order redirect flow
- Payment status updates

## Architecture
- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: React (CRA) + TailwindCSS + Lucide icons
- **Auth**: Hardcoded admin (admin/cleverbakes2025) with JWT cookies
- **FB Messenger**: m.me/61554594188313

## User Personas
1. **Customer** - Browses menu, places orders, tracks orders, leaves reviews
2. **Admin** - Manages products, updates order/payment statuses, approves reviews

## Core Requirements
- [x] Landing page with Hero, About, Menu, Testimonials, Contact, Footer
- [x] Product catalog from MongoDB (15 seeded Filipino bakery items)
- [x] Order form with GCash (upload proof) and COD payment methods
- [x] FB Messenger redirect on order submission
- [x] 6-digit order tracking number
- [x] Order tracking page with 5-step status timeline
- [x] Admin login (admin/cleverbakes2025)
- [x] Admin dashboard: Products CRUD, Orders management, Reviews approval
- [x] Payment status management (Pending/Paid/Refunded)
- [x] Order status management (Pending/Confirmed/Preparing/Ready/Completed)
- [x] Review submission + admin approval workflow
- [x] Image upload for products and GCash receipts

## What's Been Implemented (March 31, 2026)
- Full backend rewrite from Netlify functions to FastAPI + MongoDB
- Complete React frontend with all sections
- Admin dashboard with sidebar navigation
- GCash manual payment with receipt upload
- COD payment option
- Order tracker with visual timeline
- All 15 original bakery products seeded
- Sample reviews seeded
- Image upload endpoint (base64)
- **Product Categories** (March 31, 2026): 4 seeded categories (Cakes, Cookies, Breads & Pastries, Brownies), admin CRUD for categories, category filter tabs on menu, category dropdown in product modal, category badges on product cards

## Testing: 100% pass rate (27/27 backend, all frontend tests)

## Deployment Recommendations
**Free and easy options:**
1. **Render.com** - Free tier for web services. Deploy backend as web service, frontend as static site
2. **Railway.app** - Free trial credits. Easy GitHub integration
3. **Vercel** (frontend) + **Render** (backend) - Best free combo
4. **Fly.io** - Generous free tier, supports Docker

## Prioritized Backlog
- P1: Email notifications on order status change
- P1: Order history for returning customers
- P2: Product categories/filtering
- P2: Bulk order management in admin
- P2: Dashboard analytics (sales, popular items, revenue)
- P3: Multi-image product gallery
- P3: Promo codes / discount system
