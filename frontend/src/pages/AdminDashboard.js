import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Star, LogOut, Plus, Trash2, Edit2, Check, X, ChefHat, Tag, GripVertical, Flame } from 'lucide-react';
import { checkAuth, adminLogout, getProducts, createProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus, updatePaymentStatus, deleteOrder, getReviews, toggleReview, deleteReview, uploadImage, getCategories, createCategory, updateCategory, deleteCategory, toggleBestseller } from '../api';

const TABS = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'reviews', label: 'Reviews', icon: Star },
];

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    try {
      const [pRes, cRes, oRes, rRes] = await Promise.all([getProducts(), getCategories(), getAllOrders(), getReviews(false)]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
      setOrders(oRes.data || []);
      setReviews(rRes.data || []);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
        loadData();
      } catch {
        navigate('/admin/login');
      }
    };
    verifyAuth();
  }, [navigate, loadData]);

  const handleLogout = async () => {
    try { await adminLogout(); } catch {}
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // Product handlers
  const handleSaveProduct = async (data) => {
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, data);
        showToast('Product updated');
      } else {
        await createProduct(data);
        showToast('Product added');
      }
      loadData();
      setShowModal(false);
      setEditProduct(null);
    } catch (e) {
      showToast('Error: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      showToast('Product deleted');
      loadData();
    } catch { showToast('Failed to delete'); }
  };

  const handleToggleBestseller = async (id) => {
    try {
      await toggleBestseller(id);
      showToast('Best seller updated');
      loadData();
    } catch { showToast('Failed to update'); }
  };

  // Category handlers
  const handleSaveCategory = async (data, editId) => {
    try {
      if (editId) {
        await updateCategory(editId, data);
        showToast('Category updated');
      } else {
        await createCategory(data);
        showToast('Category created');
      }
      loadData();
    } catch (e) {
      showToast('Error: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Products in it will become uncategorized.')) return;
    try {
      await deleteCategory(id);
      showToast('Category deleted');
      loadData();
    } catch { showToast('Failed to delete'); }
  };

  // Order handlers
  const handleOrderStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      showToast('Status updated');
      loadData();
    } catch { showToast('Failed to update'); }
  };

  const handlePaymentStatus = async (id, status) => {
    try {
      await updatePaymentStatus(id, status);
      showToast('Payment updated');
      loadData();
    } catch { showToast('Failed to update'); }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await deleteOrder(id);
      showToast('Order deleted');
      loadData();
    } catch { showToast('Failed to delete'); }
  };

  // Review handlers
  const handleToggleReview = async (id, approved) => {
    try {
      await toggleReview(id, approved);
      showToast(approved ? 'Review approved' : 'Review hidden');
      loadData();
    } catch { showToast('Failed to update'); }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(id);
      showToast('Review deleted');
      loadData();
    } catch { showToast('Failed to delete'); }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '—';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-mocha">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream" data-testid="admin-dashboard">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 min-h-screen bg-white border-r border-soft-border p-6 flex flex-col" data-testid="admin-sidebar">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-burnt-orange/10 rounded-full flex items-center justify-center">
              <ChefHat className="text-burnt-orange" size={20} />
            </div>
            <div>
              <p className="font-heading font-semibold text-bark text-sm">Clever Bake's</p>
              <p className="text-xs text-mocha">Admin Console</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-burnt-orange/10 text-burnt-orange' : 'text-mocha hover:bg-warm-sand hover:text-bark'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon size={18} />
                {tab.label}
                <span className="ml-auto text-xs bg-warm-sand rounded-full px-2 py-0.5">
                  {tab.id === 'products' ? products.length : tab.id === 'categories' ? categories.length : tab.id === 'orders' ? orders.length : reviews.length}
                </span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-mocha hover:text-red-600 transition-colors"
            data-testid="admin-logout-button"
          >
            <LogOut size={18} /> Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              categories={categories}
              getCategoryName={getCategoryName}
              onAdd={() => { setEditProduct(null); setShowModal(true); }}
              onEdit={(p) => { setEditProduct(p); setShowModal(true); }}
              onDelete={handleDeleteProduct}
              onToggleBestseller={handleToggleBestseller}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              products={products}
              onSave={handleSaveCategory}
              onDelete={handleDeleteCategory}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              onStatusChange={handleOrderStatus}
              onPaymentChange={handlePaymentStatus}
              onDelete={handleDeleteOrder}
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab
              reviews={reviews}
              onToggle={handleToggleReview}
              onDelete={handleDeleteReview}
            />
          )}
        </main>
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-bark text-white px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in-up" data-testid="admin-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Categories Tab ───
function CategoriesTab({ categories, products, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0 });
  const [showForm, setShowForm] = useState(false);

  const startEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, description: cat.description || '', sort_order: cat.sort_order || 0 });
    setShowForm(true);
  };

  const startNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', sort_order: categories.length });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ name: form.name.trim(), description: form.description.trim(), sort_order: parseInt(form.sort_order) || 0 }, editing);
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', description: '', sort_order: 0 });
  };

  const getProductCount = (catId) => products.filter(p => p.category_id === catId).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-semibold text-bark">Categories</h2>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="add-category-button">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-soft-border p-6 mb-6" data-testid="category-form">
          <h3 className="font-heading text-lg font-semibold text-bark mb-4">{editing ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Name <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  required
                  placeholder="e.g. Cakes"
                  className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30"
                  data-testid="category-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Short description"
                  className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30"
                  data-testid="category-desc-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({...f, sort_order: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30"
                  data-testid="category-sort-input"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="save-category-button">
                {editing ? 'Update' : 'Create'} Category
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 bg-warm-sand text-bark rounded-xl text-sm font-semibold hover:bg-soft-border transition-all" data-testid="cancel-category-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="categories-table">
          <thead>
            <tr className="border-b border-soft-border">
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Order</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Description</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Products</th>
              <th className="text-right px-5 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 text-mocha">
                    <GripVertical size={14} />
                    <span className="text-sm font-mono">{cat.sort_order}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-burnt-orange/10 rounded-lg flex items-center justify-center">
                      <Tag className="text-burnt-orange" size={14} />
                    </div>
                    <span className="font-medium text-bark text-sm">{cat.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-mocha">{cat.description || '—'}</td>
                <td className="px-5 py-3">
                  <span className="text-sm font-semibold text-burnt-orange">{getProductCount(cat.id)}</span>
                  <span className="text-xs text-mocha ml-1">items</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-mocha hover:text-burnt-orange transition-colors" data-testid={`edit-category-${cat.id}`}>
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(cat.id)} className="p-1.5 text-mocha hover:text-red-500 transition-colors" data-testid={`delete-category-${cat.id}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-mocha">No categories yet. Click "Add Category" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products Tab ───
function ProductsTab({ products, categories, getCategoryName, onAdd, onEdit, onDelete, onToggleBestseller }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-semibold text-bark">Products</h2>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="add-product-button">
          <Plus size={16} /> Add Product
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="products-table">
          <thead>
            <tr className="border-b border-soft-border">
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Product</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Price</th>
              <th className="text-center px-5 py-3 text-xs text-mocha uppercase tracking-wider">Best Seller</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Variations</th>
              <th className="text-right px-5 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                    <div>
                      <p className="font-medium text-bark text-sm">{p.name}</p>
                      <p className="text-xs text-mocha truncate max-w-[200px]">{p.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.category_id ? 'bg-burnt-orange/10 text-burnt-orange' : 'bg-warm-sand text-mocha'}`}>
                    {getCategoryName(p.category_id)}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-semibold text-burnt-orange">&#8369;{p.price}</td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => onToggleBestseller(p.id)}
                    className={`p-2 rounded-lg transition-all ${p.is_bestseller ? 'bg-burnt-orange/10 text-burnt-orange hover:bg-burnt-orange/20' : 'bg-warm-sand/50 text-mocha/40 hover:bg-warm-sand hover:text-mocha'}`}
                    title={p.is_bestseller ? 'Remove Best Seller' : 'Mark as Best Seller'}
                    data-testid={`toggle-bestseller-${p.id}`}
                  >
                    <Flame size={16} className={p.is_bestseller ? 'fill-burnt-orange' : ''} />
                  </button>
                </td>
                <td className="px-5 py-3 text-xs text-mocha">{(p.variations || []).join(', ') || '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(p)} className="p-1.5 text-mocha hover:text-burnt-orange transition-colors" data-testid={`edit-product-${p.id}`}><Edit2 size={15} /></button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 text-mocha hover:text-red-500 transition-colors" data-testid={`delete-product-${p.id}`}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Orders Tab ───
function OrdersTab({ orders, onStatusChange, onPaymentChange, onDelete }) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold text-bark mb-6">Orders</h2>
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="orders-table">
            <thead>
              <tr className="border-b border-soft-border">
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Order #</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Payment</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Pay Status</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-bark">{o.order_number}</td>
                  <td className="px-4 py-3 text-sm text-bark">{o.product_name}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-bark">{o.customer_name}</p>
                    <p className="text-xs text-mocha">{o.contact_number}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-bark">{o.quantity}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-burnt-orange">&#8369;{o.total}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.payment_method === 'GCash' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {o.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.payment_status}
                      onChange={(e) => onPaymentChange(o.id, e.target.value)}
                      className="text-xs border border-soft-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      data-testid={`payment-select-${o.id}`}
                    >
                      {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => onStatusChange(o.id, e.target.value)}
                      className="text-xs border border-soft-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-burnt-orange"
                      data-testid={`status-select-${o.id}`}
                    >
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-mocha">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => onDelete(o.id)} className="p-1.5 text-mocha hover:text-red-500 transition-colors" data-testid={`delete-order-${o.id}`}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-mocha">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Reviews Tab ───
function ReviewsTab({ reviews, onToggle, onDelete }) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold text-bark mb-6">Reviews</h2>
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="reviews-table">
          <thead>
            <tr className="border-b border-soft-border">
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Rating</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Message</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-bark">{r.name}</td>
                <td className="px-5 py-3 text-sm text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                <td className="px-5 py-3 text-sm text-mocha max-w-xs truncate">{r.message}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onToggle(r.id, !r.approved)}
                      className={`p-1.5 transition-colors ${r.approved ? 'text-green-600 hover:text-yellow-600' : 'text-mocha hover:text-green-600'}`}
                      title={r.approved ? 'Unapprove' : 'Approve'}
                      data-testid={`toggle-review-${r.id}`}
                    >
                      {r.approved ? <X size={15} /> : <Check size={15} />}
                    </button>
                    <button onClick={() => onDelete(r.id)} className="p-1.5 text-mocha hover:text-red-500 transition-colors" data-testid={`delete-review-${r.id}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-mocha">No reviews yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Product Modal ───
function ProductModal({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    image: product?.image || '',
    variations: (product?.variations || []).join(', '),
    sizes: (product?.sizes || []).join(', '),
    category_id: product?.category_id || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file);
      setForm(f => ({ ...f, image: res.url }));
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      image: form.image,
      variations: form.variations.split(',').map(v => v.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      category_id: form.category_id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} data-testid="product-modal">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-xl font-semibold text-bark">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="text-mocha hover:text-bark text-xl" data-testid="close-product-modal">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-name-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({...f, category_id: e.target.value}))}
              className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30"
              data-testid="product-category-select"
            >
              <option value="">— No Category —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Price (PHP)</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-price-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 resize-none" data-testid="product-desc-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Variations (comma separated)</label>
            <input value={form.variations} onChange={e => setForm(f => ({...f, variations: e.target.value}))} placeholder="Chocolate, Vanilla, Ube" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-variations-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Sizes (comma separated)</label>
            <input value={form.sizes} onChange={e => setForm(f => ({...f, sizes: e.target.value}))} placeholder="Small, Medium, Large" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-sizes-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-mocha" data-testid="product-image-input" />
            {uploading && <p className="text-xs text-mocha mt-1">Uploading...</p>}
            {form.image && <img src={form.image} alt="" className="mt-2 w-full h-32 object-cover rounded-xl border border-soft-border" />}
          </div>
          <button type="submit" className="w-full py-3 bg-burnt-orange text-white rounded-xl font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="save-product-button">
            {product ? 'Update Product' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
}
