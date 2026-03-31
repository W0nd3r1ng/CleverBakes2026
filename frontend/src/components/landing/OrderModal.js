import React, { useState } from 'react';
import { createOrder, validateVoucher } from '../../api';
import { X, Upload, Tag, Check } from 'lucide-react';

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
    voucherCode: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const subtotal = product.price * (form.quantity || 0);
  const total = Math.max(0, subtotal - discount);

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

  const handleApplyVoucher = async () => {
    if (!form.voucherCode.trim()) return;
    setApplyingVoucher(true);
    setVoucherError('');
    setVoucherApplied(null);
    setDiscount(0);
    try {
      const res = await validateVoucher(form.voucherCode.trim(), subtotal);
      setDiscount(res.data.discount);
      setVoucherApplied(res.data.voucher);
    } catch (err) {
      setVoucherError(err.response?.data?.detail || 'Invalid voucher');
      setDiscount(0);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setForm(f => ({ ...f, voucherCode: '' }));
    setVoucherApplied(null);
    setDiscount(0);
    setVoucherError('');
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
        total: subtotal,
        payment_method: form.paymentMethod,
        gcash_proof: form.gcashProof,
        voucher_code: voucherApplied ? form.voucherCode : '',
      });

      const order = res.data;
      setSuccess(order);

      let msg = `New CleverBakes Order #${order.order_number}\n\nProduct: ${form.productName}`;
      if (form.flavor) msg += `\nFlavor: ${form.flavor}`;
      if (form.size) msg += `\nSize: ${form.size}`;
      msg += `\nQuantity: ${form.quantity}`;
      if (discount > 0) msg += `\nSubtotal: PHP ${subtotal}\nDiscount: -PHP ${discount} (${voucherApplied?.code})`;
      msg += `\nTotal: PHP ${order.total}\n\nName: ${form.clientName}\nContact: ${form.contactNumber}\nAddress: ${form.address}\nDelivery: ${form.deliveryMethod}\nPayment: ${form.paymentMethod}`;

      const messengerUrl = `https://m.me/61554594188313?text=${encodeURIComponent(msg)}`;
      window.open(messengerUrl, '_blank');
    } catch {
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
          {success.discount > 0 && (
            <p className="text-sm text-green-600 font-medium mb-2">You saved &#8369;{success.discount} with code {success.voucher_code}!</p>
          )}
          <p className="text-sm text-bark mb-1">Your tracking number:</p>
          <p className="text-3xl font-mono font-bold text-burnt-orange mb-4" data-testid="order-tracking-number">{success.order_number}</p>
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
          <div>
            <label className="block text-sm font-medium text-bark mb-1">Product</label>
            <input value={form.productName} disabled className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-warm-sand/50 text-mocha" />
          </div>

          {product.variations?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Flavor / Variation</label>
              <select value={form.flavor} onChange={e => handleChange('flavor', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="flavor-select">
                {product.variations.filter(v => v && v !== '0').map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Size</label>
              <select value={form.size} onChange={e => handleChange('size', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="size-select">
                {product.sizes.filter(s => s && s !== '0').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-bark mb-1">Quantity</label>
            <input type="number" min="1" value={form.quantity} onChange={e => { handleChange('quantity', parseInt(e.target.value) || 0); setDiscount(0); setVoucherApplied(null); }} className={`w-full px-4 py-2.5 rounded-xl border ${errors.quantity ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30`} data-testid="quantity-input" />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark mb-1">Your Name <span className="text-red-400">*</span></label>
            <input value={form.clientName} onChange={e => handleChange('clientName', e.target.value)} placeholder="Full name" className={`w-full px-4 py-2.5 rounded-xl border ${errors.clientName ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30`} data-testid="client-name-input" />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark mb-1">Contact Number <span className="text-red-400">*</span></label>
            <input value={form.contactNumber} onChange={e => handleContactChange(e.target.value)} placeholder="09123456789" maxLength={11} inputMode="numeric" className={`w-full px-4 py-2.5 rounded-xl border ${errors.contactNumber ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30`} data-testid="contact-input" />
            {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark mb-1">Address <span className="text-red-400">*</span></label>
            <textarea value={form.address} onChange={e => handleChange('address', e.target.value)} rows={2} placeholder="Complete address" className={`w-full px-4 py-2.5 rounded-xl border ${errors.address ? 'border-red-300 bg-red-50' : 'border-soft-border'} bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 resize-none`} data-testid="address-input" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

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

          {form.paymentMethod === 'GCash' && (
            <div className={`p-4 rounded-xl border ${errors.gcashProof ? 'border-red-300 bg-red-50' : 'border-soft-border bg-warm-sand/30'}`} data-testid="gcash-section">
              <p className="text-sm font-medium text-bark mb-2">GCash Payment</p>
              <p className="text-xs text-mocha mb-3">Send payment to <strong>0938-780-5835</strong> (Clever Bake's) then upload your receipt below.</p>
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-soft-border bg-white cursor-pointer hover:border-burnt-orange/30 transition-colors">
                <Upload size={16} className="text-mocha" />
                <span className="text-sm text-mocha">{form.gcashProof ? 'Receipt uploaded' : 'Upload receipt screenshot'}</span>
                <input type="file" accept="image/*" onChange={handleGcashUpload} className="sr-only" data-testid="gcash-upload-input" />
              </label>
              {form.gcashProof && <img src={form.gcashProof} alt="GCash receipt" className="mt-2 w-full h-32 object-cover rounded-xl" />}
              {errors.gcashProof && <p className="text-xs text-red-500 mt-1">{errors.gcashProof}</p>}
            </div>
          )}

          {/* Voucher Code */}
          <div data-testid="voucher-section">
            <label className="block text-sm font-medium text-bark mb-1">Voucher Code</label>
            {voucherApplied ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                <Check size={16} className="text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">{voucherApplied.code} applied!</p>
                  <p className="text-xs text-green-600">
                    {voucherApplied.discount_type === 'percentage' ? `${voucherApplied.discount_value}% off` : `₱${voucherApplied.discount_value} off`}
                    {' '} — You save &#8369;{discount}
                  </p>
                </div>
                <button type="button" onClick={handleRemoveVoucher} className="text-xs text-red-500 hover:text-red-700 font-medium" data-testid="remove-voucher-button">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-mocha" size={15} />
                  <input
                    value={form.voucherCode}
                    onChange={e => { handleChange('voucherCode', e.target.value.toUpperCase()); setVoucherError(''); }}
                    placeholder="Enter code"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-burnt-orange/30"
                    data-testid="voucher-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={applyingVoucher || !form.voucherCode.trim()}
                  className="px-4 py-2.5 bg-bark text-white rounded-xl text-sm font-semibold hover:bg-bark-light transition-all disabled:opacity-40"
                  data-testid="apply-voucher-button"
                >
                  {applyingVoucher ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {voucherError && <p className="text-xs text-red-500 mt-1" data-testid="voucher-error">{voucherError}</p>}
          </div>

          {/* Total */}
          <div className="p-4 rounded-xl bg-burnt-orange/5 border border-burnt-orange/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-mocha">Subtotal</span>
              <span className="text-sm text-bark">&#8369;{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Discount ({voucherApplied?.code})</span>
                <span className="text-sm font-medium text-green-600">-&#8369;{discount}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-burnt-orange/10">
              <span className="font-semibold text-bark">Total</span>
              <span className="text-2xl font-bold text-burnt-orange" data-testid="order-total">&#8369;{total}</span>
            </div>
          </div>

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
