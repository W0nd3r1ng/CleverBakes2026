import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Star, LogOut, Plus, Trash2, Edit2, Check, X, ChefHat, Tag, GripVertical, Flame, BarChart3, Ticket, TrendingUp, DollarSign, Clock, Users, RefreshCw, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { checkAuth, adminLogout, getProducts, createProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus, batchUpdateOrderStatus, updatePaymentStatus, deleteOrder, getReviews, toggleReview, deleteReview, uploadImage, getCategories, createCategory, updateCategory, deleteCategory, toggleBestseller, getVouchers, createVoucher, updateVoucher, deleteVoucher, getAnalytics, getAdmins, createAdmin, updateAdmin, setAdminPassword, deleteAdmin, changeOwnPassword } from '../api';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'vouchers', label: 'Vouchers', icon: Ticket },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'users', label: 'User Management', icon: Users },
];

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled', 'Refunded'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded', 'Rejected'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState('');
  const [notifications, setNotifications] = useState({ products: 0, categories: 0, reviews: 0, orders: 0 });
  const knownIds = useRef({ products: new Set(), reviews: new Set(), orders: new Set() });
  const activeTabRef = useRef(activeTab);
  const notificationSeenKey = 'cleverbakes-admin-notifications-seen';

  const getActivityTime = (item) => item.updated_at || item.created_at || '';
  const getLatestActivity = (items) => items.reduce((latest, item) => {
    const activity = getActivityTime(item);
    return activity > latest ? activity : latest;
  }, '');
  const getSeenTimes = () => {
    try {
      return JSON.parse(localStorage.getItem(notificationSeenKey)) || {};
    } catch {
      return {};
    }
  };
  const saveSeenTime = (tabId, items) => {
    const seen = getSeenTimes();
    seen[tabId] = getLatestActivity(items) || new Date().toISOString();
    localStorage.setItem(notificationSeenKey, JSON.stringify(seen));
  };
  const countUnseen = (items, seenAt, pendingOnly = false) => items.filter(item => {
    if (pendingOnly && item.approved) return false;
    return getActivityTime(item) > (seenAt || '');
  }).length;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    try {
      const [pRes, cRes, oRes, rRes, vRes, aRes, uRes] = await Promise.all([
        getProducts(), getCategories(), getAllOrders(), getReviews(false), getVouchers(), getAnalytics(), getAdmins()
      ]);
      const nextProducts = pRes.data || [];
      const nextOrders = oRes.data || [];
      const nextReviews = rRes.data || [];
      setProducts(nextProducts);
      setCategories(cRes.data || []);
      setOrders(nextOrders);
      setReviews(nextReviews);
      setVouchers(vRes.data || []);
      setAnalytics(aRes.data || null);
      setAdmins(uRes.data || []);
      const seen = getSeenTimes();
      const hasSeenHistory = ['products', 'categories', 'reviews', 'orders'].some(tab => seen[tab]);
      if (!hasSeenHistory) {
        setNotifications({
          products: nextProducts.length,
          categories: (cRes.data || []).length,
          reviews: nextReviews.filter(item => !item.approved).length,
          orders: nextOrders.length,
        });
      } else {
        setNotifications({
          products: countUnseen(nextProducts, seen.products),
          categories: countUnseen(cRes.data || [], seen.categories),
          reviews: countUnseen(nextReviews, seen.reviews, true),
          orders: countUnseen(nextOrders, seen.orders),
        });
      }
      knownIds.current = {
        products: new Set(nextProducts.map(item => item.id)),
        reviews: new Set(nextReviews.map(item => item.id)),
        orders: new Set(nextOrders.map(item => item.id)),
      };
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }
      try {
        const me = await checkAuth();
        setCurrentUser(me.user || null);
        await loadData();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
        }
        navigate('/admin/login');
      }
    };
    verifyAuth();
  }, [navigate, loadData]);

  useEffect(() => {
    if (loading) return;
    const tick = async () => {
      try {
        const [pRes, cRes, rRes, oRes] = await Promise.all([getProducts(), getCategories(), getReviews(false), getAllOrders()]);
        const nextProducts = pRes.data || [];
        const nextCategories = cRes.data || [];
        const nextReviews = rRes.data || [];
        const nextOrders = oRes.data || [];
        const seen = getSeenTimes();
        knownIds.current = {
          products: new Set(nextProducts.map(item => item.id)),
          reviews: new Set(nextReviews.map(item => item.id)),
          orders: new Set(nextOrders.map(item => item.id)),
        };
        setProducts(nextProducts);
        setCategories(nextCategories);
        setReviews(nextReviews);
        setOrders(nextOrders);
        setNotifications({
          products: activeTabRef.current === 'products' ? 0 : countUnseen(nextProducts, seen.products),
          categories: activeTabRef.current === 'categories' ? 0 : countUnseen(nextCategories, seen.categories),
          reviews: activeTabRef.current === 'reviews' ? 0 : countUnseen(nextReviews, seen.reviews, true),
          orders: activeTabRef.current === 'orders' ? 0 : countUnseen(nextOrders, seen.orders),
        });
        if (activeTab === 'analytics') {
          const aRes = await getAnalytics();
          setAnalytics(aRes.data || null);
        }
      } catch {}
    };
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, [loading, activeTab]);

  const changeTab = (tabId) => {
    activeTabRef.current = tabId;
    setActiveTab(tabId);
    const tabItems = { products, categories, reviews, orders };
    if (tabItems[tabId]) {
      saveSeenTime(tabId, tabItems[tabId]);
      setNotifications(current => ({ ...current, [tabId]: 0 }));
    }
  };

  const handleLogout = async () => {
    try { await adminLogout(); } catch {}
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleSaveProduct = async (data) => {
    try {
      if (editProduct) { await updateProduct(editProduct.id, data); showToast('Product updated'); }
      else { await createProduct(data); showToast('Product added'); }
      loadData(); setShowModal(false); setEditProduct(null);
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || e.message)); }
  };
  const handleDeleteProduct = async (id) => { if (!window.confirm('Delete this product?')) return; try { await deleteProduct(id); showToast('Product deleted'); loadData(); } catch { showToast('Failed to delete'); } };
  const handleToggleBestseller = async (id) => { try { await toggleBestseller(id); showToast('Best seller updated'); loadData(); } catch { showToast('Failed to update'); } };
  const handleSaveCategory = async (data, editId) => { try { if (editId) { await updateCategory(editId, data); showToast('Category updated'); } else { await createCategory(data); showToast('Category created'); } loadData(); } catch (e) { showToast('Error: ' + (e.response?.data?.detail || e.message)); } };
  const handleDeleteCategory = async (id) => { if (!window.confirm('Delete this category?')) return; try { await deleteCategory(id); showToast('Category deleted'); loadData(); } catch { showToast('Failed to delete'); } };
  const handleOrderStatus = async (id, s) => { try { await updateOrderStatus(id, s); showToast('Status updated'); loadData(); } catch { showToast('Failed'); } };
  const handleBatchStatus = async (ids, s) => { try { await batchUpdateOrderStatus(ids, s); showToast(`Updated ${ids.length} order${ids.length === 1 ? '' : 's'}`); loadData(); } catch { showToast('Failed'); } };
  const handlePaymentStatus = async (id, s) => { try { await updatePaymentStatus(id, s); showToast('Payment updated'); loadData(); } catch { showToast('Failed'); } };
  const handleDeleteOrder = async (id) => { if (!window.confirm('Delete this order?')) return; try { await deleteOrder(id); showToast('Order deleted'); loadData(); } catch { showToast('Failed'); } };
  const handleToggleReview = async (id, approved) => { try { await toggleReview(id, approved); showToast(approved ? 'Approved' : 'Hidden'); loadData(); } catch { showToast('Failed'); } };
  const handleDeleteReview = async (id) => { if (!window.confirm('Delete?')) return; try { await deleteReview(id); showToast('Deleted'); loadData(); } catch { showToast('Failed'); } };
  const handleSaveVoucher = async (data, editId) => { try { if (editId) { await updateVoucher(editId, data); showToast('Voucher updated'); } else { await createVoucher(data); showToast('Voucher created'); } loadData(); } catch (e) { showToast('Error: ' + (e.response?.data?.detail || e.message)); } };
  const handleDeleteVoucher = async (id) => { if (!window.confirm('Delete this voucher?')) return; try { await deleteVoucher(id); showToast('Voucher deleted'); loadData(); } catch { showToast('Failed'); } };
  const handleSaveAdmin = async (data, editId) => { try { if (editId) { await updateAdmin(editId, data); showToast('Account updated'); } else { await createAdmin(data); showToast('Admin account created'); } loadData(); } catch (e) { showToast('Error: ' + (e.response?.data?.detail || e.message)); } };
  const handleSetAdminPassword = async (id, password) => { try { await setAdminPassword(id, password); showToast('Password updated'); } catch (e) { showToast('Error: ' + (e.response?.data?.detail || e.message)); throw e; } };
  const handleDeleteAdmin = async (id) => { if (!window.confirm('Delete this admin account?')) return; try { await deleteAdmin(id); showToast('Account deleted'); loadData(); } catch (e) { showToast('Error: ' + (e.response?.data?.detail || e.message)); } };
  const handleChangeOwnPassword = async (currentPassword, newPassword) => {
    await changeOwnPassword(currentPassword, newPassword);
    showToast('Password changed');
    setShowPasswordModal(false);
  };

  const getCategoryName = (catId) => { const c = categories.find(x => x.id === catId); return c ? c.name : '—'; };

  const tabCounts = { products: notifications.products, categories: notifications.categories, orders: notifications.orders, reviews: notifications.reviews, vouchers: '', analytics: '', users: '' };
  const visibleTabs = TABS.filter(tab => tab.id !== 'users' || currentUser?.is_super_admin);

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-mocha">Loading dashboard...</div></div>;

  return (
    <div className="min-h-screen bg-cream" data-testid="admin-dashboard">
      <div className="flex">
        <aside className="w-60 min-h-screen bg-white border-r border-soft-border p-6 flex flex-col" data-testid="admin-sidebar">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-burnt-orange/10 rounded-full flex items-center justify-center"><ChefHat className="text-burnt-orange" size={20} /></div>
            <div><p className="font-heading font-semibold text-bark text-sm">Clever Bake's</p><p className="text-xs text-mocha">Admin Console</p></div>
          </div>
          <nav className="flex-1 space-y-1.5">
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => changeTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-burnt-orange/10 text-burnt-orange' : 'text-mocha hover:bg-warm-sand hover:text-bark'}`} data-testid={`tab-${tab.id}`}>
                <tab.icon size={18} />{tab.label}
                {tabCounts[tab.id] > 0 && <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-0.5" data-testid={`${tab.id}-notification`}>{tabCounts[tab.id]}</span>}
              </button>
            ))}
          </nav>
          <button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-mocha hover:text-bark transition-colors" data-testid="change-password-button"><KeyRound size={18} /> Change Password</button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-mocha hover:text-red-600 transition-colors" data-testid="admin-logout-button"><LogOut size={18} /> Logout</button>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          {activeTab === 'analytics' && <AnalyticsTab analytics={analytics} onLoadPeriod={async (year, month) => { const aRes = await getAnalytics(year, month); setAnalytics(aRes.data || null); }} />}
          {activeTab === 'products' && <ProductsTab products={products} categories={categories} getCategoryName={getCategoryName} onAdd={() => { setEditProduct(null); setShowModal(true); }} onEdit={(p) => { setEditProduct(p); setShowModal(true); }} onDelete={handleDeleteProduct} onToggleBestseller={handleToggleBestseller} />}
          {activeTab === 'categories' && <CategoriesTab categories={categories} products={products} onSave={handleSaveCategory} onDelete={handleDeleteCategory} />}
          {activeTab === 'orders' && <OrdersTab orders={orders} onStatusChange={handleOrderStatus} onBatchStatus={handleBatchStatus} onPaymentChange={handlePaymentStatus} onDelete={handleDeleteOrder} onRefresh={loadData} />}
          {activeTab === 'vouchers' && <VouchersTab vouchers={vouchers} onSave={handleSaveVoucher} onDelete={handleDeleteVoucher} />}
          {activeTab === 'reviews' && <ReviewsTab reviews={reviews} onToggle={handleToggleReview} onDelete={handleDeleteReview} />}
          {activeTab === 'users' && <UsersTab admins={admins} currentUser={currentUser} onSave={handleSaveAdmin} onSetPassword={handleSetAdminPassword} onDelete={handleDeleteAdmin} />}
        </main>
      </div>

      {showModal && <ProductModal product={editProduct} categories={categories} onSave={handleSaveProduct} onClose={() => { setShowModal(false); setEditProduct(null); }} />}
      {showPasswordModal && <PasswordModal onSave={handleChangeOwnPassword} onClose={() => setShowPasswordModal(false)} />}
      {toast && <div className="fixed bottom-6 right-6 bg-bark text-white px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in-up" data-testid="admin-toast">{toast}</div>}
    </div>
  );
}

// ─── Analytics Tab ───
function AnalyticsTab({ analytics, onLoadPeriod }) {
  const now = new Date();
  const [mode, setMode] = useState('all');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  if (!analytics) return <div className="text-mocha text-center py-20">Loading analytics...</div>;

  const years = Array.from(new Set((analytics.available_months || []).map(m => parseInt(m.slice(0, 4), 10)).concat([now.getFullYear()]))).sort((a, b) => b - a);
  const months = [
    { v: 1, l: 'January' }, { v: 2, l: 'February' }, { v: 3, l: 'March' }, { v: 4, l: 'April' },
    { v: 5, l: 'May' }, { v: 6, l: 'June' }, { v: 7, l: 'July' }, { v: 8, l: 'August' },
    { v: 9, l: 'September' }, { v: 10, l: 'October' }, { v: 11, l: 'November' }, { v: 12, l: 'December' },
  ];

  const applyPeriod = async (nextMode, nextYear, nextMonth) => {
    setMode(nextMode);
    if (nextMode === 'all') await onLoadPeriod();
    else await onLoadPeriod(nextYear, nextMonth);
  };

  const statCards = [
    { label: 'Total Revenue', value: `₱${(analytics.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-100' },
    { label: 'Refunded', value: `₱${(analytics.refunded_total || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-red-600 bg-red-100' },
    { label: 'Total Orders', value: analytics.total_orders, icon: ShoppingCart, color: 'text-blue-600 bg-blue-100' },
    { label: 'Avg Order', value: `₱${analytics.avg_order_value}`, icon: TrendingUp, color: 'text-burnt-orange bg-burnt-orange/10' },
    { label: 'Paid Orders', value: analytics.paid_orders, icon: Check, color: 'text-green-600 bg-green-100' },
    { label: 'Pending', value: analytics.pending_orders, icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    { label: 'Products', value: analytics.total_products, icon: Package, color: 'text-ube bg-ube/10' },
  ];

  const maxProductOrders = analytics.top_products.length > 0 ? Math.max(...analytics.top_products.map(p => p.orders)) : 1;
  const maxRevenue = analytics.revenue_chart.length > 0 ? Math.max(...analytics.revenue_chart.map(d => d.revenue)) : 1;

  return (
    <div data-testid="analytics-tab">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-semibold text-bark">Dashboard Analytics</h2>
        <div className="flex flex-wrap items-center gap-2" data-testid="analytics-period-controls">
          <button onClick={() => applyPeriod('all')} className={`px-3 py-2 rounded-xl text-sm font-semibold ${mode === 'all' ? 'bg-burnt-orange text-white' : 'bg-white border border-soft-border text-bark'}`}>All Time</button>
          <button onClick={() => applyPeriod('month', year, month)} className={`px-3 py-2 rounded-xl text-sm font-semibold ${mode === 'month' ? 'bg-burnt-orange text-white' : 'bg-white border border-soft-border text-bark'}`}>Monthly</button>
          {mode === 'month' && (
            <>
              <select value={month} onChange={e => { const m = parseInt(e.target.value, 10); setMonth(m); applyPeriod('month', year, m); }} className="px-3 py-2 rounded-xl border border-soft-border bg-white text-sm text-bark">
                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <select value={year} onChange={e => { const y = parseInt(e.target.value, 10); setYear(y); applyPeriod('month', y, month); }} className="px-3 py-2 rounded-xl border border-soft-border bg-white text-sm text-bark">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8" data-testid="analytics-stats">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-soft-border p-4 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon size={18} /></div>
            <p className="text-2xl font-bold text-bark">{s.value}</p>
            <p className="text-xs text-mocha mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-soft-border p-6" data-testid="revenue-chart">
          <h3 className="font-heading font-semibold text-bark mb-4">Revenue Over Time</h3>
          {analytics.revenue_chart.length === 0 ? (
            <p className="text-mocha text-sm py-8 text-center">No order data yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.revenue_chart.slice(-10).map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-mocha w-20 flex-shrink-0">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-warm-sand/50 rounded-full h-6 overflow-hidden">
                    <div className="bg-burnt-orange/80 h-full rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max(5, (d.revenue / maxRevenue) * 100)}%` }}>
                      <span className="text-[10px] font-bold text-white">₱{d.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-xs text-mocha w-12 text-right">{d.orders} ord</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-soft-border p-6" data-testid="top-products-chart">
          <h3 className="font-heading font-semibold text-bark mb-4">Top Products</h3>
          {analytics.top_products.length === 0 ? (
            <p className="text-mocha text-sm py-8 text-center">No order data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.top_products.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-burnt-orange w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-bark truncate max-w-[180px]">{p.name}</span>
                      <span className="text-xs text-mocha">{p.orders} orders / ₱{p.revenue.toLocaleString()}</span>
                    </div>
                    <div className="bg-warm-sand/50 rounded-full h-2 overflow-hidden">
                      <div className="bg-burnt-orange h-full rounded-full transition-all" style={{ width: `${(p.orders / maxProductOrders) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="bg-white rounded-2xl border border-soft-border p-6" data-testid="status-breakdown">
          <h3 className="font-heading font-semibold text-bark mb-4">Order Status</h3>
          <div className="space-y-3">
            {Object.entries(analytics.status_breakdown).map(([status, count]) => {
              const colors = { Pending: 'bg-yellow-500', Confirmed: 'bg-blue-500', Preparing: 'bg-purple-500', Ready: 'bg-green-500', Completed: 'bg-bark', Cancelled: 'bg-red-400', Refunded: 'bg-red-700' };
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-mocha'}`} />
                  <span className="text-sm text-bark flex-1">{status}</span>
                  <span className="text-sm font-bold text-bark">{count}</span>
                </div>
              );
            })}
            {Object.keys(analytics.status_breakdown).length === 0 && <p className="text-mocha text-sm text-center">No orders yet</p>}
          </div>
        </div>

        {/* Payment & Category */}
        <div className="bg-white rounded-2xl border border-soft-border p-6" data-testid="payment-breakdown">
          <h3 className="font-heading font-semibold text-bark mb-4">Payment Methods</h3>
          <div className="space-y-3 mb-6">
            {Object.entries(analytics.payment_breakdown).map(([method, count]) => (
              <div key={method} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${method === 'GCash' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                <span className="text-sm text-bark flex-1">{method}</span>
                <span className="text-sm font-bold text-bark">{count}</span>
              </div>
            ))}
            {Object.keys(analytics.payment_breakdown).length === 0 && <p className="text-mocha text-sm text-center">No orders yet</p>}
          </div>
          <h3 className="font-heading font-semibold text-bark mb-3">Products by Category</h3>
          <div className="space-y-2">
            {Object.entries(analytics.category_breakdown).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-bark">{cat}</span>
                <span className="text-xs font-semibold bg-burnt-orange/10 text-burnt-orange px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vouchers Tab ───
function VouchersTab({ vouchers, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: 10, min_order: 0, max_uses: 0, expiry_date: '', is_active: true });

  const startNew = () => { setEditing(null); setForm({ code: '', discount_type: 'percentage', discount_value: 10, min_order: 0, max_uses: 0, expiry_date: '', is_active: true }); setShowForm(true); };
  const startEdit = (v) => { setEditing(v.id); setForm({ code: v.code, discount_type: v.discount_type, discount_value: v.discount_value, min_order: v.min_order || 0, max_uses: v.max_uses || 0, expiry_date: v.expiry_date ? v.expiry_date.slice(0, 10) : '', is_active: v.is_active }); setShowForm(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    const data = { ...form, code: form.code.toUpperCase(), discount_value: parseFloat(form.discount_value) || 0, min_order: parseFloat(form.min_order) || 0, max_uses: parseInt(form.max_uses) || 0, expiry_date: form.expiry_date ? `${form.expiry_date}T23:59:59+00:00` : '' };
    onSave(data, editing);
    setShowForm(false); setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-semibold text-bark">Vouchers & Discounts</h2>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="add-voucher-button"><Plus size={16} /> Add Voucher</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-soft-border p-6 mb-6" data-testid="voucher-form">
          <h3 className="font-heading text-lg font-semibold text-bark mb-4">{editing ? 'Edit Voucher' : 'New Voucher'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Code <span className="text-red-400">*</span></label>
                <input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} required placeholder="WELCOME10" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark uppercase focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="voucher-code-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Discount Type</label>
                <select value={form.discount_type} onChange={e => setForm(f => ({...f, discount_type: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="voucher-type-select">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (PHP)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Discount Value</label>
                <input type="number" min="0" step="0.01" value={form.discount_value} onChange={e => setForm(f => ({...f, discount_value: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="voucher-value-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Min Order (PHP)</label>
                <input type="number" min="0" value={form.min_order} onChange={e => setForm(f => ({...f, min_order: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="voucher-minorder-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Max Uses (0 = unlimited)</label>
                <input type="number" min="0" value={form.max_uses} onChange={e => setForm(f => ({...f, max_uses: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="voucher-maxuses-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Expiry Date</label>
                <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({...f, expiry_date: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="voucher-expiry-input" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="rounded" data-testid="voucher-active-checkbox" />
              <span className="text-sm font-medium text-bark">Active</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="save-voucher-button">{editing ? 'Update' : 'Create'} Voucher</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 bg-warm-sand text-bark rounded-xl text-sm font-semibold hover:bg-soft-border transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="vouchers-table">
          <thead>
            <tr className="border-b border-soft-border">
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Code</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Discount</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Min Order</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Uses</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Expiry</th>
              <th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                <td className="px-5 py-3 text-sm font-mono font-bold text-bark">{v.code}</td>
                <td className="px-5 py-3 text-sm font-semibold text-burnt-orange">{v.discount_type === 'percentage' ? `${v.discount_value}%` : `₱${v.discount_value}`}</td>
                <td className="px-5 py-3 text-sm text-mocha">{v.min_order > 0 ? `₱${v.min_order}` : '—'}</td>
                <td className="px-5 py-3 text-sm text-mocha">{v.times_used}{v.max_uses > 0 ? `/${v.max_uses}` : '/∞'}</td>
                <td className="px-5 py-3 text-xs text-mocha">{v.expiry_date ? v.expiry_date.slice(0, 10) : 'No expiry'}</td>
                <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(v)} className="p-1.5 text-mocha hover:text-burnt-orange transition-colors" data-testid={`edit-voucher-${v.id}`}><Edit2 size={15} /></button>
                    <button onClick={() => onDelete(v.id)} className="p-1.5 text-mocha hover:text-red-500 transition-colors" data-testid={`delete-voucher-${v.id}`}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-mocha">No vouchers yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Categories Tab ───
function CategoriesTab({ categories, products, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0 });
  const [showForm, setShowForm] = useState(false);
  const startEdit = (cat) => { setEditing(cat.id); setForm({ name: cat.name, description: cat.description || '', sort_order: cat.sort_order || 0 }); setShowForm(true); };
  const startNew = () => { setEditing(null); setForm({ name: '', description: '', sort_order: categories.length }); setShowForm(true); };
  const handleSubmit = (e) => { e.preventDefault(); if (!form.name.trim()) return; onSave({ name: form.name.trim(), description: form.description.trim(), sort_order: parseInt(form.sort_order) || 0 }, editing); setShowForm(false); setEditing(null); };
  const getProductCount = (catId) => products.filter(p => p.category_id === catId).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-semibold text-bark">Categories</h2>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="add-category-button"><Plus size={16} /> Add Category</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-2xl border border-soft-border p-6 mb-6" data-testid="category-form">
          <h3 className="font-heading text-lg font-semibold text-bark mb-4">{editing ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-bark mb-1">Name *</label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="e.g. Cakes" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="category-name-input" /></div>
              <div><label className="block text-sm font-medium text-bark mb-1">Description</label><input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Short desc" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="category-desc-input" /></div>
              <div><label className="block text-sm font-medium text-bark mb-1">Sort Order</label><input type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="category-sort-input" /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold" data-testid="save-category-button">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 bg-warm-sand text-bark rounded-xl text-sm font-semibold">Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="categories-table"><thead><tr className="border-b border-soft-border"><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Order</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Category</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Description</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Products</th><th className="text-right px-5 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                <td className="px-5 py-3"><div className="flex items-center gap-2 text-mocha"><GripVertical size={14} /><span className="text-sm font-mono">{cat.sort_order}</span></div></td>
                <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-burnt-orange/10 rounded-lg flex items-center justify-center"><Tag className="text-burnt-orange" size={14} /></div><span className="font-medium text-bark text-sm">{cat.name}</span></div></td>
                <td className="px-5 py-3 text-sm text-mocha">{cat.description || '—'}</td>
                <td className="px-5 py-3"><span className="text-sm font-semibold text-burnt-orange">{getProductCount(cat.id)}</span><span className="text-xs text-mocha ml-1">items</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-2"><button onClick={() => startEdit(cat)} className="p-1.5 text-mocha hover:text-burnt-orange" data-testid={`edit-category-${cat.id}`}><Edit2 size={15} /></button><button onClick={() => onDelete(cat.id)} className="p-1.5 text-mocha hover:text-red-500" data-testid={`delete-category-${cat.id}`}><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-mocha">No categories yet</td></tr>}
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
      <div className="flex items-center justify-between mb-6"><h2 className="font-heading text-2xl font-semibold text-bark">Products</h2><button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="add-product-button"><Plus size={16} /> Add Product</button></div>
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="products-table"><thead><tr className="border-b border-soft-border"><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Product</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Category</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Price</th><th className="text-center px-5 py-3 text-xs text-mocha uppercase tracking-wider">Best Seller</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Variations</th><th className="text-right px-5 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                <td className="px-5 py-3"><div className="flex items-center gap-3">{p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}<div><p className="font-medium text-bark text-sm">{p.name}</p><p className="text-xs text-mocha truncate max-w-[200px]">{p.description}</p></div></div></td>
                <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.category_id ? 'bg-burnt-orange/10 text-burnt-orange' : 'bg-warm-sand text-mocha'}`}>{getCategoryName(p.category_id)}</span></td>
                <td className="px-5 py-3 text-sm font-semibold text-burnt-orange">&#8369;{p.price}</td>
                <td className="px-5 py-3 text-center"><button onClick={() => onToggleBestseller(p.id)} className={`p-2 rounded-lg transition-all ${p.is_bestseller ? 'bg-burnt-orange/10 text-burnt-orange hover:bg-burnt-orange/20' : 'bg-warm-sand/50 text-mocha/40 hover:bg-warm-sand hover:text-mocha'}`} data-testid={`toggle-bestseller-${p.id}`}><Flame size={16} className={p.is_bestseller ? 'fill-burnt-orange' : ''} /></button></td>
                <td className="px-5 py-3 text-xs text-mocha">{(p.variations || []).join(', ') || '—'}</td>
                <td className="px-5 py-3"><div className="flex justify-end gap-2"><button onClick={() => onEdit(p)} className="p-1.5 text-mocha hover:text-burnt-orange" data-testid={`edit-product-${p.id}`}><Edit2 size={15} /></button><button onClick={() => onDelete(p.id)} className="p-1.5 text-mocha hover:text-red-500" data-testid={`delete-product-${p.id}`}><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Orders Tab ───
function OrdersTab({ orders, onStatusChange, onBatchStatus, onPaymentChange, onDelete, onRefresh }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [batchStatus, setBatchStatus] = useState('Confirmed');
  const [proofOrder, setProofOrder] = useState(null);

  const counts = ORDER_STATUSES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {});
  const filtered = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);
  const allVisibleIds = filtered.map(o => o.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selected.includes(id));

  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(allSelected ? selected.filter(id => !allVisibleIds.includes(id)) : Array.from(new Set([...selected, ...allVisibleIds])));

  const applyBatch = () => {
    if (!selected.length) return;
    onBatchStatus(selected, batchStatus);
    setSelected([]);
  };

  const statusColor = (s) => ({
    Pending: 'bg-yellow-100 text-yellow-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Preparing: 'bg-purple-100 text-purple-700',
    Ready: 'bg-green-100 text-green-700',
    Completed: 'bg-bark text-white',
    Cancelled: 'bg-red-100 text-red-700',
    Refunded: 'bg-red-200 text-red-800',
  }[s] || 'bg-warm-sand text-mocha');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-2xl font-semibold text-bark">Orders</h2>
        <button onClick={onRefresh} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-soft-border bg-white text-sm font-medium text-bark hover:bg-warm-sand" data-testid="refresh-orders-button"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" data-testid="order-status-filters">
        <button onClick={() => setStatusFilter('All')} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusFilter === 'All' ? 'bg-burnt-orange text-white' : 'bg-white border border-soft-border text-bark'}`}>All ({orders.length})</button>
        {ORDER_STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusFilter === s ? 'bg-burnt-orange text-white' : 'bg-white border border-soft-border text-bark'}`}>{s} ({counts[s] || 0})</button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white border border-soft-border rounded-xl" data-testid="batch-status-bar">
          <span className="text-sm font-medium text-bark">{selected.length} selected</span>
          <select value={batchStatus} onChange={e => setBatchStatus(e.target.value)} className="text-sm border border-soft-border rounded-lg px-2 py-1.5 bg-white">{ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <button onClick={applyBatch} className="px-3 py-1.5 bg-burnt-orange text-white rounded-lg text-sm font-semibold">Update Status</button>
          <button onClick={() => setSelected([])} className="text-sm text-mocha hover:text-bark">Clear</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full" data-testid="orders-table"><thead><tr className="border-b border-soft-border">
          <th className="px-3 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} data-testid="select-all-orders" /></th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Order #</th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Product</th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Customer</th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Total</th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Payment</th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Proof</th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Status</th>
          <th className="text-left px-4 py-3 text-xs text-mocha uppercase tracking-wider">Date</th>
          <th className="text-right px-4 py-3 text-xs text-mocha uppercase tracking-wider">Del</th>
        </tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors align-top">
                <td className="px-3 py-3"><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleOne(o.id)} data-testid={`select-order-${o.id}`} /></td>
                <td className="px-4 py-3 text-sm font-mono font-semibold text-bark">{o.order_number}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-bark">{o.product_name}</p>
                  {(o.flavor || o.size) && <p className="text-xs text-mocha">{[o.flavor, o.size].filter(Boolean).join(' · ')}</p>}
                  {o.special_instructions && <p className="text-xs text-burnt-orange mt-1 max-w-[220px]"><span className="font-semibold">Instructions:</span> {o.special_instructions}</p>}
                </td>
                <td className="px-4 py-3"><p className="text-sm text-bark">{o.customer_name}</p><p className="text-xs text-mocha">{o.contact_number}</p><p className="text-xs text-mocha">{o.delivery_method || '—'}</p><p className="text-xs text-mocha max-w-[180px] truncate">{o.address}</p></td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-burnt-orange">&#8369;{o.total}</span>
                  {o.voucher_code && <span className="block text-[10px] text-green-600 font-medium">{o.voucher_code} (-₱{o.discount})</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.payment_method === 'GCash' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.payment_method}</span>
                  <select value={o.payment_status} onChange={(e) => onPaymentChange(o.id, e.target.value)} className="mt-1 block text-xs border border-soft-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-burnt-orange" data-testid={`payment-select-${o.id}`}>{PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </td>
                <td className="px-4 py-3">
                  {o.gcash_proof ? (
                    <div className="space-y-1">
                      <button type="button" onClick={() => setProofOrder(o)} className="block" data-testid={`view-gcash-${o.id}`}>
                        <img src={o.gcash_proof} alt="GCash proof" className="w-14 h-14 object-cover rounded-lg border border-soft-border" />
                      </button>
                      {o.payment_status !== 'Paid' && o.payment_status !== 'Refunded' && (
                        <div className="flex gap-1">
                          <button onClick={() => onPaymentChange(o.id, 'Paid')} className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold">Approve</button>
                          <button onClick={() => onPaymentChange(o.id, 'Rejected')} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">Reject</button>
                        </div>
                      )}
                    </div>
                  ) : <span className="text-xs text-mocha">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status}</span>
                    <select value={o.status} onChange={(e) => onStatusChange(o.id, e.target.value)} className="text-xs border border-soft-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-burnt-orange" data-testid={`status-select-${o.id}`}>{ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    {o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Refunded' && (
                      <button onClick={() => onStatusChange(o.id, 'Completed')} className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700" data-testid={`complete-order-${o.id}`}><CheckCircle2 size={12} /> Complete Order</button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-mocha">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><button onClick={() => onDelete(o.id)} className="p-1.5 text-mocha hover:text-red-500" data-testid={`delete-order-${o.id}`}><Trash2 size={15} /></button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-mocha">No orders in this status</td></tr>}
          </tbody>
        </table>
      </div></div>

      {proofOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setProofOrder(null)} data-testid="gcash-proof-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-bark">GCash Proof · #{proofOrder.order_number}</h3>
              <button onClick={() => setProofOrder(null)} className="text-mocha hover:text-bark"><X size={18} /></button>
            </div>
            <img src={proofOrder.gcash_proof} alt="GCash proof" className="w-full max-h-[70vh] object-contain rounded-xl border border-soft-border mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { onPaymentChange(proofOrder.id, 'Paid'); setProofOrder(null); }} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold">Approve Payment</button>
              <button onClick={() => { onPaymentChange(proofOrder.id, 'Rejected'); setProofOrder(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reviews Tab ───
function ReviewsTab({ reviews, onToggle, onDelete }) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold text-bark mb-6">Reviews</h2>
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="reviews-table"><thead><tr className="border-b border-soft-border"><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Name</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Rating</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Message</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase tracking-wider">Status</th><th className="text-right px-5 py-3 text-xs text-mocha uppercase tracking-wider">Actions</th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className="border-b border-soft-border/50 hover:bg-warm-sand/30 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-bark">{r.name}</td>
                <td className="px-5 py-3 text-sm text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</td>
                <td className="px-5 py-3 text-sm text-mocha max-w-xs truncate">{r.message}</td>
                <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.approved ? 'Approved' : 'Pending'}</span></td>
                <td className="px-5 py-3"><div className="flex justify-end gap-2"><button onClick={() => onToggle(r.id, !r.approved)} className={`p-1.5 ${r.approved ? 'text-green-600 hover:text-yellow-600' : 'text-mocha hover:text-green-600'}`} data-testid={`toggle-review-${r.id}`}>{r.approved ? <X size={15} /> : <Check size={15} />}</button><button onClick={() => onDelete(r.id)} className="p-1.5 text-mocha hover:text-red-500" data-testid={`delete-review-${r.id}`}><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-mocha">No reviews yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Product Modal ───
function ProductModal({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({ name: product?.name || '', description: product?.description || '', price: product?.price || '', image: product?.image || '', variations: (product?.variations || []).join(', '), sizes: (product?.sizes || []).join(', '), category_id: product?.category_id || '' });
  const [uploading, setUploading] = useState(false);
  const handleImageUpload = async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { const res = await uploadImage(file); setForm(f => ({ ...f, image: res.url })); } catch { alert('Upload failed'); } finally { setUploading(false); } };
  const handleSubmit = (e) => { e.preventDefault(); onSave({ name: form.name, description: form.description, price: parseFloat(form.price) || 0, image: form.image, variations: form.variations.split(',').map(v => v.trim()).filter(Boolean), sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean), category_id: form.category_id }); };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose} data-testid="product-modal">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6"><h3 className="font-heading text-xl font-semibold text-bark">{product ? 'Edit Product' : 'Add Product'}</h3><button onClick={onClose} className="text-mocha hover:text-bark text-xl" data-testid="close-product-modal">&times;</button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-bark mb-1">Name</label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-name-input" /></div>
          <div><label className="block text-sm font-medium text-bark mb-1">Category</label><select value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-category-select"><option value="">— No Category —</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-bark mb-1">Price (PHP)</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-price-input" /></div>
          <div><label className="block text-sm font-medium text-bark mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 resize-none" data-testid="product-desc-input" /></div>
          <div><label className="block text-sm font-medium text-bark mb-1">Variations (comma separated)</label><input value={form.variations} onChange={e => setForm(f => ({...f, variations: e.target.value}))} placeholder="Chocolate, Vanilla, Ube" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-variations-input" /></div>
          <div><label className="block text-sm font-medium text-bark mb-1">Sizes (comma separated)</label><input value={form.sizes} onChange={e => setForm(f => ({...f, sizes: e.target.value}))} placeholder="Small, Medium, Large" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-cream/30 text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="product-sizes-input" /></div>
          <div><label className="block text-sm font-medium text-bark mb-1">Image</label><input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-mocha" data-testid="product-image-input" />{uploading && <p className="text-xs text-mocha mt-1">Uploading...</p>}{form.image && <img src={form.image} alt="" className="mt-2 w-full h-32 object-cover rounded-xl border border-soft-border" />}</div>
          <button type="submit" className="w-full py-3 bg-burnt-orange text-white rounded-xl font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="save-product-button">{product ? 'Update Product' : 'Add Product'}</button>
        </form>
      </div>
    </div>
  );
}

// ─── User Management ───
function UsersTab({ admins, currentUser, onSave, onSetPassword, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [passwordAdmin, setPasswordAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [form, setForm] = useState({ email: '', username: '', password: '' });

  const openForm = (admin = null) => {
    setEditing(admin);
    setShowForm(true);
    setShowCreatePassword(false);
    setForm({ email: admin?.email || '', username: admin?.username || '', password: '' });
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(editing ? { email: form.email, username: form.username } : form, editing?.id);
    setEditing(null);
    setShowForm(false);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    try {
      await onSetPassword(passwordAdmin.id, newPassword);
      setPasswordAdmin(null);
      setNewPassword('');
      setShowAdminPassword(false);
    } catch (error) {
      setPasswordError(error.response?.data?.detail || 'Unable to update password');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-heading text-2xl font-semibold text-bark">User Management</h2><p className="text-sm text-mocha mt-1">Manage administrator accounts and access.</p></div>
        {currentUser?.is_super_admin && <button onClick={() => openForm()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-burnt-orange text-white rounded-xl text-sm font-semibold"><Plus size={16} /> Add Admin</button>}
      </div>
      <div className="bg-white rounded-2xl border border-soft-border overflow-hidden">
        <table className="w-full" data-testid="admins-table"><thead><tr className="border-b border-soft-border"><th className="text-left px-5 py-3 text-xs text-mocha uppercase">Email</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase">Username</th><th className="text-left px-5 py-3 text-xs text-mocha uppercase">Role</th><th className="text-right px-5 py-3 text-xs text-mocha uppercase">Actions</th></tr></thead>
          <tbody>{admins.map(admin => <tr key={admin.id} className="border-b border-soft-border/50">
            <td className="px-5 py-3 text-sm text-bark">{admin.email}</td><td className="px-5 py-3 text-sm text-mocha">{admin.username}</td><td className="px-5 py-3 text-xs text-mocha">{admin.is_super_admin ? 'Main admin' : 'Admin'}{!admin.is_active && ' · Inactive'}</td>
            <td className="px-5 py-3"><div className="flex justify-end gap-2"><button onClick={() => openForm(admin)} className="p-1.5 text-mocha hover:text-burnt-orange" aria-label={`Edit ${admin.email}`}><Edit2 size={15} /></button>{currentUser?.is_super_admin && !admin.is_super_admin && <><button onClick={() => { setPasswordAdmin(admin); setNewPassword(''); setPasswordError(''); }} className="p-1.5 text-mocha hover:text-burnt-orange" aria-label={`Change password for ${admin.email}`}><KeyRound size={15} /></button><button onClick={() => onDelete(admin.id)} className="p-1.5 text-mocha hover:text-red-500" aria-label={`Delete ${admin.email}`}><Trash2 size={15} /></button></>}</div></td>
          </tr>)}</tbody>
        </table>
      </div>
      {showForm ? <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setEditing(null); setShowForm(false); setForm({ email: '', username: '', password: '' }); }}><div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><h3 className="font-heading text-xl font-semibold text-bark">{editing ? 'Edit Admin' : 'Add Admin'}</h3><button onClick={() => { setEditing(null); setShowForm(false); }}><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email" required className="w-full px-4 py-2.5 rounded-xl border border-soft-border" /><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username (optional)" className="w-full px-4 py-2.5 rounded-xl border border-soft-border" />{!editing && <div className="relative"><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type={showCreatePassword ? 'text' : 'password'} placeholder="Strong password" required minLength={10} autoComplete="new-password" className="w-full px-4 py-2.5 pr-11 rounded-xl border border-soft-border" /><button type="button" onClick={() => setShowCreatePassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha" aria-label={showCreatePassword ? 'Hide password' : 'Show password'} data-testid="toggle-add-admin-password">{showCreatePassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>}<button type="submit" className="w-full py-3 bg-burnt-orange text-white rounded-xl font-semibold">{editing ? 'Save Changes' : 'Create Account'}</button></form></div></div> : null}
      {passwordAdmin && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPasswordAdmin(null)}><div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><div><h3 className="font-heading text-xl font-semibold text-bark">Change Admin Password</h3><p className="text-sm text-mocha mt-1">{passwordAdmin.email}</p></div><button onClick={() => setPasswordAdmin(null)}><X size={18} /></button></div><form onSubmit={submitPassword} className="space-y-4"><div className="relative"><input value={newPassword} onChange={e => setNewPassword(e.target.value)} type={showAdminPassword ? 'text' : 'password'} placeholder="New strong password" required minLength={10} autoComplete="new-password" className="w-full px-4 py-2.5 pr-11 rounded-xl border border-soft-border" /><button type="button" onClick={() => setShowAdminPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha" aria-label={showAdminPassword ? 'Hide password' : 'Show password'}>{showAdminPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{passwordError && <p className="text-sm text-red-600">{passwordError}</p>}<button type="submit" className="w-full py-3 bg-burnt-orange text-white rounded-xl font-semibold">Update Password</button></form></div></div>}
    </div>
  );
}

function PasswordModal({ onSave, onClose }) {
  const [form, setForm] = useState({ current: '', next: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false });
  const submit = async (e) => { e.preventDefault(); await onSave(form.current, form.next); };
  return <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}><div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-5"><h3 className="font-heading text-xl font-semibold text-bark">Change Password</h3><button onClick={onClose}><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><div className="relative"><input type={showPassword.current ? 'text' : 'password'} value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} placeholder="Current password" required autoComplete="current-password" className="w-full px-4 py-2.5 pr-11 rounded-xl border border-soft-border" /><button type="button" onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha" aria-label={showPassword.current ? 'Hide password' : 'Show password'}>{showPassword.current ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><div className="relative"><input type={showPassword.next ? 'text' : 'password'} value={form.next} onChange={e => setForm({ ...form, next: e.target.value })} placeholder="New strong password" required minLength={10} autoComplete="new-password" className="w-full px-4 py-2.5 pr-11 rounded-xl border border-soft-border" /><button type="button" onClick={() => setShowPassword({ ...showPassword, next: !showPassword.next })} className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha" aria-label={showPassword.next ? 'Hide password' : 'Show password'}>{showPassword.next ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><button type="submit" className="w-full py-3 bg-burnt-orange text-white rounded-xl font-semibold">Update Password</button></form></div></div>;
}
