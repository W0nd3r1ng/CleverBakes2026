import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Open mailto as fallback since no emailJS needed
    const subject = `Message from ${form.name}`;
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    window.open(`mailto:cleverbakes@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setStatus('success');
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setStatus(null), 5000);
  };

  return (
    <section id="contact" className="py-20 px-4 bg-cream" data-testid="contact-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm text-burnt-orange uppercase tracking-[0.15em] font-semibold mb-3">Get in Touch</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-bark tracking-tight">Contact Us</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="font-heading text-xl font-semibold text-bark">Visit Us</h3>
            {[
              { icon: MapPin, label: 'Address', value: 'Sweet Street, Bakery District' },
              { icon: Phone, label: 'Phone', value: '+639387805835' },
              { icon: Mail, label: 'Email', value: 'cleverbakes@gmail.com' },
              { icon: Clock, label: 'Hours', value: 'Mon-Sat: 7AM-7PM | Sun: 8AM-5PM' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-burnt-orange/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="text-burnt-orange" size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-bark">{item.label}</p>
                  <p className="text-sm text-mocha">{item.value}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <a
                href="https://m.me/61554594188313"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                data-testid="messenger-contact-button"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.906 1.445 5.5 3.71 7.19V22l3.405-1.869c.909.252 1.871.387 2.885.387 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.076 12.457l-2.548-2.718-4.972 2.718 5.467-5.804 2.61 2.718 4.91-2.718-5.467 5.804z"/></svg>
                Message on Facebook
              </a>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="contact-form">
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required className="w-full px-4 py-3 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" placeholder="Your name" data-testid="contact-name-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required className="w-full px-4 py-3 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30" placeholder="your@email.com" data-testid="contact-email-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-bark mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} required rows={4} className="w-full px-4 py-3 rounded-xl border border-soft-border bg-white text-bark focus:outline-none focus:ring-2 focus:ring-burnt-orange/30 resize-none" placeholder="Your message..." data-testid="contact-message-input" />
              </div>
              {status === 'success' && <p className="text-green-600 text-sm font-medium text-center">Message ready to send via your email client!</p>}
              <button type="submit" className="w-full py-3 bg-burnt-orange text-white rounded-full font-semibold hover:bg-burnt-orange-dark transition-all" data-testid="contact-submit-button">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
