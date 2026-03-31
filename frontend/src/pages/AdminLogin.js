import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';
import { ChefHat } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(username, password);
      if (res.token) {
        localStorage.setItem('adminToken', res.token);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4" data-testid="admin-login-page">
      <div className="w-full max-w-md bg-white rounded-2xl border border-soft-border p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-burnt-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="text-burnt-orange" size={28} />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-bark">Admin Login</h1>
          <p className="text-mocha text-sm mt-1">Clever Bake's Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" data-testid="admin-login-form">
          <div>
            <label className="block text-sm font-medium text-bark mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              className="w-full px-4 py-3 rounded-xl border border-soft-border bg-cream/50 text-bark placeholder:text-mocha/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 focus:border-burnt-orange transition-all"
              data-testid="admin-username-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 rounded-xl border border-soft-border bg-cream/50 text-bark placeholder:text-mocha/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 focus:border-burnt-orange transition-all"
              data-testid="admin-password-input"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl" data-testid="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-burnt-orange text-white rounded-xl font-semibold hover:bg-burnt-orange-dark transition-all disabled:opacity-50"
            data-testid="admin-login-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
