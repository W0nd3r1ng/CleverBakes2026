import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { createReview } from '../../api';

export default function Testimonials({ reviews }) {
  const [form, setForm] = useState({ name: '', rating: 5, message: '' });
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) { setNotice('Please fill all fields.'); return; }
    setSubmitting(true);
    try {
      await createReview({ name: form.name.trim(), rating: Number(form.rating), message: form.message.trim() });
      setForm({ name: '', rating: 5, message: '' });
      setNotice('Thanks! Your review will appear after approval.');
    } catch {
      setNotice('Could not save review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayReviews = reviews.length > 0 ? reviews : [
    { id: '1', name: 'Sarah Johnson', rating: 5, message: "The best bakery in town! Their chocolate chip cookies are absolutely divine." },
    { id: '2', name: 'Michael Chen', rating: 5, message: "Ordered a custom birthday cake for my daughter's party. Beautiful and delicious!" },
    { id: '3', name: 'Emily Rodriguez', rating: 5, message: "I've tried almost everything on their menu. The ube cheesecake is my favorite!" },
  ];

  return (
    <section id="testimonials" className="py-20 px-4 bg-white" data-testid="testimonials-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm text-burnt-orange uppercase tracking-[0.15em] font-semibold mb-3">Testimonials</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-bark tracking-tight">What Our Customers Say</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {displayReviews.slice(0, 6).map((r, i) => (
            <div key={r.id || i} className="p-6 rounded-2xl bg-warm-sand/40 border border-soft-border hover:-translate-y-1 transition-all duration-300" data-testid={`review-card-${i}`}>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className={j < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                ))}
              </div>
              <p className="text-bark-light italic mb-4 leading-relaxed">"{r.message}"</p>
              <p className="font-semibold text-bark text-sm">— {r.name}</p>
            </div>
          ))}
        </div>

        {/* Review Form */}
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-warm-sand/30 border border-soft-border">
          <h3 className="font-heading text-xl font-semibold text-bark mb-4 text-center">Share Your Experience</h3>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="review-form">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Your Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="Sweet Fan" className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="review-name-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Rating</label>
                <select value={form.rating} onChange={e => setForm(f => ({...f, rating: e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" data-testid="review-rating-select">
                  {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} - {r === 5 ? 'Perfect' : r === 4 ? 'Great' : r === 3 ? 'Good' : r === 2 ? 'Fair' : 'Poor'}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark mb-1">Message</label>
              <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} required rows={3} placeholder="Tell us about your experience..." className="w-full px-4 py-2.5 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 resize-none" data-testid="review-message-input" />
            </div>
            {notice && <p className="text-center text-sm font-medium text-burnt-orange" data-testid="review-notice">{notice}</p>}
            <div className="flex justify-center">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-burnt-orange text-white rounded-xl font-semibold hover:bg-burnt-orange-dark transition-all disabled:opacity-50" data-testid="submit-review-button">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
