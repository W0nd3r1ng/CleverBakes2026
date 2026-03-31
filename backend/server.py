from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
import base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random
import string

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_SECRET = os.environ.get("JWT_SECRET", "cleverbakes-jwt-secret-2025-bakery")
JWT_ALGORITHM = "HS256"

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "cleverbakes2025"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Helpers ───

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_order_number():
    return ''.join(random.choices(string.digits, k=6))

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ─── Models ───

class AdminLogin(BaseModel):
    username: str
    password: str

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    sort_order: Optional[int] = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    image: Optional[str] = ""
    variations: Optional[List[str]] = []
    sizes: Optional[List[str]] = []
    category_id: Optional[str] = ""
    is_bestseller: Optional[bool] = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    variations: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    category_id: Optional[str] = None
    is_bestseller: Optional[bool] = None

class OrderCreate(BaseModel):
    product_name: str
    customer_name: str
    contact_number: str
    address: str
    delivery_method: str = "Pick Up"
    flavor: Optional[str] = ""
    size: Optional[str] = ""
    quantity: int = 1
    total: float = 0
    payment_method: str = "COD"
    gcash_proof: Optional[str] = ""
    voucher_code: Optional[str] = ""

class OrderStatusUpdate(BaseModel):
    status: str

class PaymentStatusUpdate(BaseModel):
    payment_status: str

class ReviewCreate(BaseModel):
    name: str
    rating: int = 5
    message: Optional[str] = ""

class ReviewToggle(BaseModel):
    approved: bool

class VoucherCreate(BaseModel):
    code: str
    discount_type: str = "percentage"  # "percentage" or "fixed"
    discount_value: float = 10
    min_order: Optional[float] = 0
    max_uses: Optional[int] = 0
    expiry_date: Optional[str] = ""
    is_active: Optional[bool] = True

class VoucherUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None
    is_active: Optional[bool] = None

# ─── Auth ───

@api_router.post("/auth/login")
async def admin_login(data: AdminLogin, response: Response):
    if data.username != ADMIN_USERNAME or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token("admin", "admin")
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=False, samesite="lax", max_age=86400, path="/"
    )
    return {"success": True, "token": token, "user": {"username": "admin", "role": "admin"}}

@api_router.post("/auth/logout")
async def admin_logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    admin = await get_current_admin(request)
    return {"success": True, "user": {"username": "admin", "role": admin["role"]}}

# ─── Categories ───

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return {"success": True, "data": categories}

@api_router.post("/categories")
async def create_category(data: CategoryCreate, request: Request):
    await get_current_admin(request)
    category = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description or "",
        "sort_order": data.sort_order or 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.categories.insert_one(category)
    category.pop("_id", None)
    return {"success": True, "data": category}

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, data: CategoryUpdate, request: Request):
    await get_current_admin(request)
    update = {}
    for field in ["name", "description", "sort_order"]:
        val = getattr(data, field)
        if val is not None:
            update[field] = val
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.categories.update_one({"id": category_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return {"success": True, "data": category}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, request: Request):
    await get_current_admin(request)
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    # Unset category_id from products that had this category
    await db.products.update_many({"category_id": category_id}, {"$set": {"category_id": ""}})
    return {"success": True, "message": "Category deleted"}

# ─── Products ───

@api_router.get("/products")
async def get_products():
    products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"success": True, "data": products}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "data": product}

@api_router.post("/products")
async def create_product(data: ProductCreate, request: Request):
    await get_current_admin(request)
    product = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description or "",
        "price": data.price,
        "image": data.image or "",
        "variations": data.variations or [],
        "sizes": data.sizes or [],
        "category_id": data.category_id or "",
        "is_bestseller": data.is_bestseller or False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.products.insert_one(product)
    product.pop("_id", None)
    return {"success": True, "data": product}

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, request: Request):
    await get_current_admin(request)
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for field in ["name", "description", "price", "image", "variations", "sizes", "category_id", "is_bestseller"]:
        val = getattr(data, field)
        if val is not None:
            update[field] = val
    result = await db.products.update_one({"id": product_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return {"success": True, "data": product}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    await get_current_admin(request)
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "message": "Product deleted"}

@api_router.put("/products/{product_id}/bestseller")
async def toggle_bestseller(product_id: str, request: Request):
    await get_current_admin(request)
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    new_val = not product.get("is_bestseller", False)
    await db.products.update_one({"id": product_id}, {"$set": {"is_bestseller": new_val, "updated_at": datetime.now(timezone.utc).isoformat()}})
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return {"success": True, "data": product}

# ─── Orders ───

@api_router.post("/orders")
async def create_order(data: OrderCreate):
    order_number = generate_order_number()
    while await db.orders.find_one({"order_number": order_number}):
        order_number = generate_order_number()
    
    discount = 0
    voucher_code = ""
    if data.voucher_code:
        voucher = await db.vouchers.find_one({"code": data.voucher_code.upper(), "is_active": True})
        if voucher:
            if voucher["discount_type"] == "percentage":
                discount = round(data.total * (voucher["discount_value"] / 100), 2)
            else:
                discount = min(voucher["discount_value"], data.total)
            voucher_code = voucher["code"]
            await db.vouchers.update_one({"id": voucher["id"]}, {"$inc": {"times_used": 1}})
    
    final_total = round(data.total - discount, 2)
    
    order = {
        "id": str(uuid.uuid4()),
        "order_number": order_number,
        "product_name": data.product_name,
        "customer_name": data.customer_name,
        "contact_number": data.contact_number,
        "address": data.address,
        "delivery_method": data.delivery_method,
        "flavor": data.flavor or "",
        "size": data.size or "",
        "quantity": data.quantity,
        "subtotal": data.total,
        "discount": discount,
        "voucher_code": voucher_code,
        "total": final_total,
        "payment_method": data.payment_method,
        "gcash_proof": data.gcash_proof or "",
        "payment_status": "Paid" if data.payment_method == "GCash" and data.gcash_proof else "Pending",
        "status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    return {"success": True, "data": order}

@api_router.get("/orders/track/{order_number}")
async def track_order(order_number: str):
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "data": order}

@api_router.get("/orders")
async def get_all_orders(request: Request):
    await get_current_admin(request)
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"success": True, "data": orders}

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    await get_current_admin(request)
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return {"success": True, "data": order}

@api_router.put("/orders/{order_id}/payment")
async def update_payment_status(order_id: str, data: PaymentStatusUpdate, request: Request):
    await get_current_admin(request)
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": data.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return {"success": True, "data": order}

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, request: Request):
    await get_current_admin(request)
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "message": "Order deleted"}

# ─── Reviews ───

@api_router.get("/reviews")
async def get_reviews(approved_only: bool = False):
    query = {"approved": True} if approved_only else {}
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"success": True, "data": reviews}

@api_router.post("/reviews")
async def create_review(data: ReviewCreate):
    review = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "rating": min(max(data.rating, 1), 5),
        "message": data.message or "",
        "approved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return {"success": True, "data": review}

@api_router.put("/reviews/{review_id}/toggle")
async def toggle_review(review_id: str, data: ReviewToggle, request: Request):
    await get_current_admin(request)
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"approved": data.approved}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    return {"success": True, "data": review}

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, request: Request):
    await get_current_admin(request)
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"success": True, "message": "Review deleted"}

# ─── Vouchers ───

@api_router.get("/vouchers")
async def get_vouchers(request: Request):
    await get_current_admin(request)
    vouchers = await db.vouchers.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"success": True, "data": vouchers}

@api_router.post("/vouchers")
async def create_voucher(data: VoucherCreate, request: Request):
    await get_current_admin(request)
    existing = await db.vouchers.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Voucher code already exists")
    voucher = {
        "id": str(uuid.uuid4()),
        "code": data.code.upper(),
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "min_order": data.min_order or 0,
        "max_uses": data.max_uses or 0,
        "times_used": 0,
        "expiry_date": data.expiry_date or "",
        "is_active": data.is_active if data.is_active is not None else True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.vouchers.insert_one(voucher)
    voucher.pop("_id", None)
    return {"success": True, "data": voucher}

@api_router.put("/vouchers/{voucher_id}")
async def update_voucher(voucher_id: str, data: VoucherUpdate, request: Request):
    await get_current_admin(request)
    update = {}
    for field in ["code", "discount_type", "discount_value", "min_order", "max_uses", "expiry_date", "is_active"]:
        val = getattr(data, field)
        if val is not None:
            if field == "code":
                val = val.upper()
            update[field] = val
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.vouchers.update_one({"id": voucher_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    voucher = await db.vouchers.find_one({"id": voucher_id}, {"_id": 0})
    return {"success": True, "data": voucher}

@api_router.delete("/vouchers/{voucher_id}")
async def delete_voucher(voucher_id: str, request: Request):
    await get_current_admin(request)
    result = await db.vouchers.delete_one({"id": voucher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    return {"success": True, "message": "Voucher deleted"}

@api_router.post("/vouchers/validate")
async def validate_voucher(request: Request):
    body = await request.json()
    code = (body.get("code") or "").upper()
    subtotal = body.get("subtotal", 0)
    if not code:
        raise HTTPException(status_code=400, detail="Voucher code required")
    voucher = await db.vouchers.find_one({"code": code}, {"_id": 0})
    if not voucher:
        raise HTTPException(status_code=404, detail="Invalid voucher code")
    if not voucher.get("is_active", True):
        raise HTTPException(status_code=400, detail="This voucher is no longer active")
    if voucher.get("max_uses") and voucher.get("times_used", 0) >= voucher["max_uses"]:
        raise HTTPException(status_code=400, detail="This voucher has reached its usage limit")
    if voucher.get("expiry_date"):
        try:
            exp = datetime.fromisoformat(voucher["expiry_date"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(status_code=400, detail="This voucher has expired")
        except ValueError:
            pass
    if voucher.get("min_order", 0) > subtotal:
        raise HTTPException(status_code=400, detail=f"Minimum order of ₱{voucher['min_order']} required")
    if voucher["discount_type"] == "percentage":
        discount = round(subtotal * (voucher["discount_value"] / 100), 2)
    else:
        discount = min(voucher["discount_value"], subtotal)
    return {"success": True, "data": {"voucher": voucher, "discount": discount, "new_total": round(subtotal - discount, 2)}}

# ─── Analytics ───

@api_router.get("/analytics")
async def get_analytics(request: Request):
    await get_current_admin(request)
    orders = await db.orders.find({}, {"_id": 0}).to_list(5000)
    products = await db.products.find({}, {"_id": 0}).to_list(200)
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)

    total_orders = len(orders)
    total_revenue = sum(o.get("total", 0) for o in orders)
    avg_order = round(total_revenue / total_orders, 2) if total_orders else 0
    paid_orders = sum(1 for o in orders if o.get("payment_status") == "Paid")
    pending_orders = sum(1 for o in orders if o.get("status") == "Pending")

    # Orders by status
    status_counts = {}
    for o in orders:
        s = o.get("status", "Unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    # Payment method breakdown
    payment_counts = {}
    for o in orders:
        pm = o.get("payment_method", "Unknown")
        payment_counts[pm] = payment_counts.get(pm, 0) + 1

    # Popular products (by order count)
    product_orders = {}
    product_revenue = {}
    for o in orders:
        pn = o.get("product_name", "Unknown")
        product_orders[pn] = product_orders.get(pn, 0) + 1
        product_revenue[pn] = product_revenue.get(pn, 0) + o.get("total", 0)
    top_products = sorted(product_orders.items(), key=lambda x: x[1], reverse=True)[:8]

    # Revenue by date (last 30 days)
    daily_revenue = {}
    daily_orders = {}
    for o in orders:
        try:
            d = o.get("created_at", "")[:10]
            if d:
                daily_revenue[d] = daily_revenue.get(d, 0) + o.get("total", 0)
                daily_orders[d] = daily_orders.get(d, 0) + 1
        except Exception:
            pass
    revenue_chart = [{"date": k, "revenue": v, "orders": daily_orders.get(k, 0)} for k, v in sorted(daily_revenue.items())[-30:]]

    # Category breakdown
    cat_map = {c["id"]: c["name"] for c in categories}
    cat_products = {}
    for p in products:
        cn = cat_map.get(p.get("category_id", ""), "Uncategorized")
        cat_products[cn] = cat_products.get(cn, 0) + 1

    return {
        "success": True,
        "data": {
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "avg_order_value": avg_order,
            "paid_orders": paid_orders,
            "pending_orders": pending_orders,
            "status_breakdown": status_counts,
            "payment_breakdown": payment_counts,
            "top_products": [{"name": n, "orders": c, "revenue": round(product_revenue.get(n, 0), 2)} for n, c in top_products],
            "revenue_chart": revenue_chart,
            "category_breakdown": cat_products,
            "total_products": len(products),
        }
    }

# ─── Image Upload ───

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    mime = file.content_type or "image/jpeg"
    data_url = f"data:{mime};base64,{b64}"
    return {"success": True, "url": data_url}

# ─── Seed Data ───

SEED_CATEGORIES = [
    {"name": "Cakes", "description": "Custom and specialty cakes", "sort_order": 1},
    {"name": "Cookies", "description": "Freshly baked cookies and treats", "sort_order": 2},
    {"name": "Breads & Pastries", "description": "Bread, muffins, rolls and pastries", "sort_order": 3},
    {"name": "Brownies", "description": "Rich chocolate brownies", "sort_order": 4},
]

SEED_PRODUCT_CATEGORIES = {
    "Banana Muffins": "Breads & Pastries",
    "Banana Bread": "Breads & Pastries",
    "Cinnamon Rolls": "Breads & Pastries",
    "Custom Bento Cake": "Cakes",
    "Custom Letter Cake": "Cakes",
    "Customize Cake": "Cakes",
    "Double Chocolate Brownies": "Brownies",
    "Flower Cake": "Cakes",
    "Money Cake": "Cakes",
    "Number Cake": "Cakes",
    "Oreo Cookies": "Cookies",
    "Sansrival Cake": "Cakes",
    "S'mores Cookies": "Cookies",
    "Ube Cake": "Cakes",
    "Ube Cheesecake": "Cakes",
}

SEED_BESTSELLERS = {"Ube Cheesecake", "Customize Cake", "Cinnamon Rolls", "Double Chocolate Brownies", "Custom Bento Cake"}

SEED_PRODUCTS = [
    {"name": "Banana Muffins", "image": "/images/banana muffins.jpg", "description": "Moist and fluffy muffins with fresh bananas", "price": 250, "variations": [], "sizes": []},
    {"name": "Banana Bread", "image": "/images/banna bread.jpg", "description": "Classic homemade banana bread, perfectly sweet", "price": 350, "variations": [], "sizes": []},
    {"name": "Cinnamon Rolls", "image": "/images/Cinnamon Rolls.jpg", "description": "Warm, gooey cinnamon rolls with cream cheese frosting", "price": 300, "variations": [], "sizes": []},
    {"name": "Custom Bento Cake", "image": "/images/custom bento cake.jpg", "description": "Adorable personalized bento cakes for any occasion", "price": 650, "variations": ["Chocolate", "Vanilla", "Ube"], "sizes": ["4 inches", "6 inches"]},
    {"name": "Custom Letter Cake", "image": "/images/custom letter cake.jpg", "description": "Beautiful letter-shaped cakes with fresh decorations", "price": 800, "variations": ["Chocolate", "Vanilla", "Red Velvet"], "sizes": ["Small", "Medium", "Large"]},
    {"name": "Customize Cake", "image": "/images/Customize Cake.jpg", "description": "Fully customizable cakes made to your specifications", "price": 1300, "variations": ["Chocolate", "Vanilla", "Ube", "Red Velvet"], "sizes": ["6 inches", "8 inches", "10 inches"]},
    {"name": "Double Chocolate Brownies", "image": "/images/double chocolate brownies.jpg", "description": "Rich, fudgy brownies with double chocolate chips", "price": 300, "variations": [], "sizes": []},
    {"name": "Flower Cake", "image": "/images/flower cake.jpg", "description": "Elegant cake decorated with beautiful edible flowers", "price": 1450, "variations": ["Chocolate", "Vanilla"], "sizes": ["6 inches", "8 inches"]},
    {"name": "Money Cake", "image": "/images/money cake.jpg", "description": "Surprise cake with hidden money inside", "price": 1800, "variations": [], "sizes": ["8 inches", "10 inches"]},
    {"name": "Number Cake", "image": "/images/number cake.jpg", "description": "Celebration number cakes for birthdays and anniversaries", "price": 950, "variations": ["Chocolate", "Vanilla"], "sizes": ["Small", "Medium", "Large"]},
    {"name": "Oreo Cookies", "image": "/images/orea cookies.jpg", "description": "Homemade Oreo-style cookies with creamy filling", "price": 250, "variations": [], "sizes": []},
    {"name": "Sansrival Cake", "image": "/images/sansrival cake.jpg", "description": "Traditional Filipino layered cake with buttercream", "price": 1150, "variations": [], "sizes": ["8 inches", "10 inches"]},
    {"name": "S'mores Cookies", "image": "/images/smores cookies.jpg", "description": "Gooey cookies with marshmallows, chocolate, and graham", "price": 300, "variations": [], "sizes": []},
    {"name": "Ube Cake", "image": "/images/ube cake.jpg", "description": "Delicious purple yam cake with creamy frosting", "price": 1000, "variations": [], "sizes": ["6 inches", "8 inches"]},
    {"name": "Ube Cheesecake", "image": "/images/ube cheese cake.jpg", "description": "Creamy ube-flavored cheesecake with a graham crust", "price": 1250, "variations": [], "sizes": ["6 inches", "8 inches"]},
]

@app.on_event("startup")
async def seed_data():
    # Seed categories
    cat_count = await db.categories.count_documents({})
    category_map = {}
    if cat_count == 0:
        logger.info("Seeding categories...")
        for c in SEED_CATEGORIES:
            cat = {
                "id": str(uuid.uuid4()),
                "name": c["name"],
                "description": c["description"],
                "sort_order": c["sort_order"],
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.categories.insert_one(cat)
            category_map[c["name"]] = cat["id"]
        logger.info(f"Seeded {len(SEED_CATEGORIES)} categories")
    else:
        # Build map from existing
        cats = await db.categories.find({}, {"_id": 0}).to_list(100)
        for c in cats:
            category_map[c["name"]] = c["id"]

    # Seed products
    count = await db.products.count_documents({})
    if count == 0:
        logger.info("Seeding products...")
        for p in SEED_PRODUCTS:
            cat_name = SEED_PRODUCT_CATEGORIES.get(p["name"], "")
            product = {
                "id": str(uuid.uuid4()),
                "name": p["name"],
                "description": p["description"],
                "price": p["price"],
                "image": p["image"],
                "variations": p["variations"],
                "sizes": p["sizes"],
                "category_id": category_map.get(cat_name, ""),
                "is_bestseller": p["name"] in SEED_BESTSELLERS,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.products.insert_one(product)
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products")
    
    # Seed sample reviews
    review_count = await db.reviews.count_documents({})
    if review_count == 0:
        logger.info("Seeding reviews...")
        sample_reviews = [
            {"name": "Sarah Johnson", "rating": 5, "message": "The best bakery in town! Their chocolate chip cookies are absolutely divine. My family can't get enough!"},
            {"name": "Michael Chen", "rating": 5, "message": "Ordered a custom birthday cake for my daughter's party. It was not only beautiful but tasted amazing. Highly recommend!"},
            {"name": "Emily Rodriguez", "rating": 5, "message": "I've tried almost everything on their menu, and I've never been disappointed. The ube cheesecake is my favorite!"},
        ]
        for r in sample_reviews:
            review = {
                "id": str(uuid.uuid4()),
                "name": r["name"],
                "rating": r["rating"],
                "message": r["message"],
                "approved": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.reviews.insert_one(review)
        logger.info("Seeded sample reviews")
    
    # Seed sample vouchers
    voucher_count = await db.vouchers.count_documents({})
    if voucher_count == 0:
        logger.info("Seeding vouchers...")
        sample_vouchers = [
            {"code": "WELCOME10", "discount_type": "percentage", "discount_value": 10, "min_order": 500, "max_uses": 100, "expiry_date": "2026-12-31T23:59:59+00:00"},
            {"code": "SAVE50", "discount_type": "fixed", "discount_value": 50, "min_order": 300, "max_uses": 50, "expiry_date": "2026-06-30T23:59:59+00:00"},
        ]
        for v in sample_vouchers:
            voucher = {
                "id": str(uuid.uuid4()),
                "code": v["code"],
                "discount_type": v["discount_type"],
                "discount_value": v["discount_value"],
                "min_order": v["min_order"],
                "max_uses": v["max_uses"],
                "times_used": 0,
                "expiry_date": v["expiry_date"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.vouchers.insert_one(voucher)
        logger.info("Seeded sample vouchers")

    # Create indexes
    await db.categories.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    await db.reviews.create_index("id", unique=True)
    await db.vouchers.create_index("id", unique=True)
    await db.vouchers.create_index("code", unique=True)

# Include router & middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
