import React, { useState } from 'react';
import { Search, ArrowLeft, Package, Clock, ChefHat, CheckCircle2, Truck } from 'lucide-react';
import { trackOrder } from '../api';
import { Link } from 'react-router-dom';

const STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed'];

function StatusTimeline({ currentStatus }) {
  const currentIdx = STATUSES.indexOf(currentStatus);
  const icons = [Clock, CheckCircle2, ChefHat, Package, Truck];

  return (
    <div className="flex flex-col gap-0" data-testid="order-status-timeline">
      {STATUSES.map((s, i) => {
        const Icon = icons[i];
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                active ? 'bg-burnt-orange text-white ring-4 ring-burnt-orange/20' : done ? 'bg-green-600 text-white' : 'bg-warm-sand text-mocha'
              }`}>
                <Icon size={18} />
              </div>
              {i < STATUSES.length - 1 && (
                <div className={`w-0.5 h-12 ${done && i < currentIdx ? 'bg-green-600' : 'bg-soft-border'}`} />
              )}
            </div>
            <div className={`pt-2 pb-6 ${active ? 'text-bark font-semibold' : done ? 'text-green-700' : 'text-mocha'}`}>
              <p className="text-sm font-medium">{s}</p>
              {active && <p className="text-xs text-mocha mt-1">Current status</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await trackOrder(orderNumber.trim());
      setOrder(res.data);
    } catch {
      setError('Order not found. Please check your order number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream" data-testid="track-order-page">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-mocha hover:text-burnt-orange transition-colors mb-8" data-testid="back-to-home">
          <ArrowLeft size={18} /> Back to Home
        </Link>

        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl font-semibold text-bark tracking-tight mb-3">Track Your Order</h1>
          <p className="text-mocha">Enter your 6-digit order number to see the status</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-3 mb-8" data-testid="track-order-form">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha" size={18} />
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. 123456"
              maxLength={6}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-soft-border bg-white text-bark placeholder:text-mocha/50 focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 focus:border-burnt-orange transition-all"
              data-testid="order-number-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-burnt-orange text-white rounded-xl font-semibold hover:bg-burnt-orange-dark transition-all disabled:opacity-50"
            data-testid="track-order-button"
          >
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-center" data-testid="track-order-error">
            {error}
          </div>
        )}

        {order && (
          <div className="bg-white rounded-2xl border border-soft-border p-6 shadow-sm" data-testid="order-details">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-mocha uppercase tracking-wider">Order</p>
                <p className="text-2xl font-heading font-semibold text-bark">#{order.order_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                order.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`} data-testid="payment-status-badge">
                {order.payment_method} - {order.payment_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-warm-sand/50 rounded-xl">
              <div>
                <p className="text-xs text-mocha">Product</p>
                <p className="font-medium text-bark">{order.product_name}</p>
              </div>
              <div>
                <p className="text-xs text-mocha">Customer</p>
                <p className="font-medium text-bark">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-mocha">Quantity</p>
                <p className="font-medium text-bark">{order.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-mocha">Total</p>
                <p className="font-semibold text-burnt-orange">&#8369;{order.total}</p>
              </div>
              {order.flavor && (
                <div>
                  <p className="text-xs text-mocha">Flavor</p>
                  <p className="font-medium text-bark">{order.flavor}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-mocha">Delivery</p>
                <p className="font-medium text-bark">{order.delivery_method}</p>
              </div>
            </div>

            <h3 className="font-heading text-lg font-semibold text-bark mb-4">Order Progress</h3>
            <StatusTimeline currentStatus={order.status} />
          </div>
        )}
      </div>
    </div>
  );
}
