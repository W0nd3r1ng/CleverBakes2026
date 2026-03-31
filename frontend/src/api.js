import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Products
export const getProducts = () => api.get('/products').then(r => r.data);
export const createProduct = (data) => api.post('/products', data).then(r => r.data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data);
export const toggleBestseller = (id) => api.put(`/products/${id}/bestseller`).then(r => r.data);

// Categories
export const getCategories = () => api.get('/categories').then(r => r.data);
export const createCategory = (data) => api.post('/categories', data).then(r => r.data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data).then(r => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then(r => r.data);

// Orders
export const createOrder = (data) => api.post('/orders', data).then(r => r.data);
export const trackOrder = (orderNumber) => api.get(`/orders/track/${orderNumber}`).then(r => r.data);
export const getAllOrders = () => api.get('/orders').then(r => r.data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status }).then(r => r.data);
export const updatePaymentStatus = (id, status) => api.put(`/orders/${id}/payment`, { payment_status: status }).then(r => r.data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`).then(r => r.data);

// Reviews
export const getReviews = (approvedOnly = false) => api.get(`/reviews?approved_only=${approvedOnly}`).then(r => r.data);
export const createReview = (data) => api.post('/reviews', data).then(r => r.data);
export const toggleReview = (id, approved) => api.put(`/reviews/${id}/toggle`, { approved }).then(r => r.data);
export const deleteReview = (id) => api.delete(`/reviews/${id}`).then(r => r.data);

// Auth
export const adminLogin = (username, password) => api.post('/auth/login', { username, password }).then(r => r.data);
export const adminLogout = () => api.post('/auth/logout').then(r => r.data);
export const checkAuth = () => api.get('/auth/me').then(r => r.data);

// Vouchers
export const getVouchers = () => api.get('/vouchers').then(r => r.data);
export const createVoucher = (data) => api.post('/vouchers', data).then(r => r.data);
export const updateVoucher = (id, data) => api.put(`/vouchers/${id}`, data).then(r => r.data);
export const deleteVoucher = (id) => api.delete(`/vouchers/${id}`).then(r => r.data);
export const validateVoucher = (code, subtotal) => api.post('/vouchers/validate', { code, subtotal }).then(r => r.data);

// Analytics
export const getAnalytics = () => api.get('/analytics').then(r => r.data);

// Upload
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

export default api;
