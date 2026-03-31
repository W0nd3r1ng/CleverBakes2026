import React, { useState } from 'react';
import { createOrder } from '../../api';
import { X, Upload } from 'lucide-react';

const DELIVERY_METHODS = ['Pick Up', 'Meet Up', 'Delivery'];
const PAYMENT_METHODS = ['COD', 'GCash'];

export default function OrderModal({ product, onClose }) {
  const [form, setForm] = useState({
    productName: product.name,
    flavor: product.variations?.length > 0 ? product.variations[0] : '',
    size: product.sizes?.length > 0 ? product.sizes[0] : '',
    quantity: 1,
    clientName: '',
    contactNumber: '',
    address: '',
    deliveryMethod: 'Pick Up',
    paymentMethod: 'COD',
    gcashProof: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const total = product.price * (form.quantity || 0);

  const handleChange = (name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const handleContactChange = (value) => {
    const numeric = value.replace(/\D/g, '').slice(0, 11);
    handleChange('contactNumber', numeric);
  };

  const handleGcashUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleChange('gcashProof', reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.clientName.trim()) errs.clientName = 'Required';
    if (!form.contactNumber.trim()) errs.contactNumber = 'Required';
    if (!form.address.trim()) errs.address = 'Required';
    if (!form.quantity || form.quantity < 1) errs.quantity = 'Min 1';
    if (form.paymentMethod === 'GCash' && !form.gcashProof) errs.gcashProof = 'Please upload proof of payment';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const res = await createOrder({
        product_name: form.productName,
        customer_name: form.clientName,
        contact_number: form.contactNumber,
        address: form.address,
        delivery_method: form.deliveryMethod,
        flavor: form.flavor,
        size: form.size,
        quantity: form.quantity,
        total,
        payment_method: form.paymentMethod,
        gcash_proof: form.gcashProof,
      });

      const order = res.data;
      setSuccess(order.order_number);

      // Build FB Messenger message
      let msg = `New CleverBakes Order #${order.order_number}\n\nProduct: ${form.productName}`;
      if (form.flavor) msg += `\nFlavor: ${form.flavor}`;
      if (form.size) msg += `\nSize: ${form.size}`;
      msg += `\nQuantity: ${form.quantity}\nTotal: PHP ${total}\n\nName: ${form.clientName}\nContact: ${form.contactNumber}\nAddress: ${form.address}\nDelivery: ${form.deliveryMethod}\nPayment: ${form.paymentMethod}`;

      const messengerUrl = `https://m.me/61554594188313?text=${encodeURIComponent(msg)}`;
      window.open(messengerUrl, '_blank');
    } catch (err) {
      alert('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center" onClick={e => e.stopPropagation()} data-testid="order-success">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="font-heading text-xl font-semibold text-bark mb-2">Order Submitted!</h3>
          <p className="text-mocha mb-2">Your order has been sent to our Messenger.</p>
          <p className="text-sm text-bark mb-1">Your tracking number:</p>
          <p className="text-3xl font-mono font-bold text-burnt-orange mb-4" data-testid="order-tracking-number">{success}</p>
          <p className="text-xs text-mocha mb-6">Use this number to track your order status</p>
          <button onClick={onClose} className="px-6 py-3 bg-burnt-orange text-white rounded-xl font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="close-success-button">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="order-modal">
        <div className="sticky top-0 bg-white border-b border-soft-border px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="font-heading text-xl font-semibold text-bark">Order Form</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-warm-sand flex items-center justify-center text-bark hover:bg-soft-border transition-colors" data-testid="close-order-modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Product</label>
            <input value={form.productName} disabled className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-warm-sand/50 text-mocha" />
          </div>

          {/* Flavor */}
          {product.variations?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Flavor / Variation</label>
              <select value={form.flavor} onChange={e => handleChange('flavor', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="flavor-select">
                {product.variations.filter(v => v && v !== '0').map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}

          {/* Size */}
          {product.sizes?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Size</label>
              <select value={form.size} onChange={e => handleChange('size', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="size-select">
                {product.sizes.filter(s => s && s !== '0').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Quantity</label>
            <input type="number" min="1" value={form.quantity} onChange={e => handleChange('quantity', parseInt(e.target.value) || 0)} className={`w-full px-4 py-2.5 rounded-xl border ${errors.quantity ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30`} data-testid="quantity-input" />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Your Name <span className="text-red-400">*</span></label>
            <input value={form.clientName} onChange={e => handleChange('clientName', e.target.value)} placeholder="Full name" className={`w-full px-4 py-2.5 rounded-xl border ${errors.clientName ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30`} data-testid="client-name-input" />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Contact Number <span className="text-red-400">*</span></label>
            <input value={form.contactNumber} onChange={e => handleContactChange(e.target.value)} placeholder="09123456789" maxLength={11} inputMode="numeric" className={`w-full px-4 py-2.5 rounded-xl border ${errors.contactNumber ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30`} data-testid="contact-input" />
            {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Address <span className="text-red-400">*</span></label>
            <textarea value={form.address} onChange={e => handleChange('address', e.target.value)} rows={2} placeholder="Complete address" className={`w-full px-4 py-2.5 rounded-xl border ${errors.address ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 resize-none`} data-testid="address-input" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium text-bark mb-2">Delivery Method</label>
            <div className="flex flex-wrap gap-3">
              {DELIVERY_METHODS.map(m => (
                <label key={m} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${form.deliveryMethod === m ? 'border-burnt-orange bg-burnt-orange/5 text-burnt-orange' : 'border-soft-border text-mocha hover:border-burnt-orange/30'}`}>
                  <input type="radio" name="delivery" value={m} checked={form.deliveryMethod === m} onChange={e => handleChange('deliveryMethod', e.target.value)} className="sr-only" />
                  <span className="text-sm font-medium">{m}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-bark mb-2">Payment Method</label>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_METHODS.map(m => (
                <label key={m} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === m ? 'border-burnt-orange bg-burnt-orange/5 text-burnt-orange' : 'border-soft-border text-mocha hover:border-burnt-orange/30'}`} data-testid={`payment-${m.toLowerCase()}`}>
                  <input type="radio" name="payment" value={m} checked={form.paymentMethod === m} onChange={e => handleChange('paymentMethod', e.target.value)} className="sr-only" />
                  <span className="text-sm font-medium">{m}</span>
                </label>
              ))}
            </div>
          </div>

          {/* GCash Upload */}
          {form.paymentMethod === 'GCash' && (
            <div className={`p-4 rounded-xl border ${errors.gcashProof ? 'border-red-300 bg-red-50' : 'border-soft-border bg-warm-sand/30'}`} data-testid="gcash-section">
              <p className="text-sm font-medium text-bark mb-2">GCash Payment</p>
              <p className="text-xs text-mocha mb-3">Send payment to <strong>0938-780-5835</strong> (Clever Bake's) then upload your receipt/screenshot below.</p>
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-soft-border bg-white cursor-pointer hover:border-burnt-orange/30 transition-colors">
                <Upload size={16} className="text-mocha" />
                <span className="text-sm text-mocha">{form.gcashProof ? 'Receipt uploaded' : 'Upload receipt screenshot'}</span>
                <input type="file" accept="image/*" onChange={handleGcashUpload} className="sr-only" data-testid="gcash-upload-input" />
              </label>
              {form.gcashProof && <img src={form.gcashProof} alt="GCash receipt" className="mt-2 w-full h-32 object-cover rounded-xl" />}
              {errors.gcashProof && <p className="text-xs text-red-500 mt-1">{errors.gcashProof}</p>}
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-burnt-orange/5 border border-burnt-orange/10">
            <span className="font-medium text-bark">Total</span>
            <span className="text-2xl font-bold text-burnt-orange" data-testid="order-total">&#8369;{total}</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-burnt-orange text-white rounded-xl font-semibold hover:bg-burnt-orange-dark transition-all disabled:opacity-50"
            data-testid="submit-order-button"
          >
            {submitting ? 'Submitting...' : 'Submit Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
