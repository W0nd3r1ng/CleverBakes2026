import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu as MenuIcon, X, Search } from 'lucide-react';

const NAV_LINKS = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Menu', id: 'menu' },
  { name: 'Testimonials', id: 'testimonials' },
  { name: 'Contact', id: 'contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-soft-border' : 'bg-transparent'
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => scrollTo('home')} className="flex items-center gap-3 group" data-testid="navbar-logo">
            <img src="/images/logo.jpg" alt="Clever Bake's" className="w-10 h-10 rounded-full object-cover ring-2 ring-burnt-orange/20 group-hover:ring-burnt-orange/40 transition-all" />
            <span className="font-heading text-lg font-semibold text-bark hidden sm:block">Clever Bake's</span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm font-medium text-bark-light hover:text-burnt-orange transition-colors"
                data-testid={`nav-${link.id}`}
              >
                {link.name}
              </button>
            ))}
            <Link
              to="/track"
              className="flex items-center gap-1.5 text-sm font-medium text-burnt-orange hover:text-burnt-orange-dark transition-colors"
              data-testid="nav-track-order"
            >
              <Search size={14} /> Track Order
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-bark" data-testid="mobile-menu-toggle">
            {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-soft-border pt-4" data-testid="mobile-menu">
            {NAV_LINKS.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left py-2 text-bark-light hover:text-burnt-orange text-sm font-medium transition-colors">
                {link.name}
              </button>
            ))}
            <Link to="/track" className="block py-2 text-burnt-orange text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Track Order
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
