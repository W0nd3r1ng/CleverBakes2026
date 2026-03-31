import React, { useState, useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import About from '../components/landing/About';
import Menu from '../components/landing/Menu';
import Testimonials from '../components/landing/Testimonials';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
import OrderModal from '../components/landing/OrderModal';
import { getProducts, getReviews } from '../api';

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [orderProduct, setOrderProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, rRes] = await Promise.all([getProducts(), getReviews(true)]);
        setProducts(pRes.data || []);
        setReviews(rRes.data || []);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-cream" data-testid="landing-page">
      <Navbar />
      <Hero />
      <About />
      <Menu products={products} loading={loading} onOrder={setOrderProduct} />
      <Testimonials reviews={reviews} />
      <Contact />
      <Footer />
      {orderProduct && (
        <OrderModal
          product={orderProduct}
          onClose={() => setOrderProduct(null)}
        />
      )}
    </div>
  );
}
