import React from 'react';

export default function Hero() {
  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
      style={{ background: 'linear-gradient(135deg, #FFF5E6 0%, #FDFBF7 40%, #F4EFE6 100%)' }}
      data-testid="hero-section"
    >
      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-burnt-orange/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-ube/5 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto px-4 text-center z-10">
        <div className="mb-8 animate-fade-in-up">
          <img
            src="/images/logo.jpg"
            alt="Clever Bake's Logo"
            className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover shadow-xl mx-auto ring-4 ring-white"
          />
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-bark tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          Freshly Baked Happiness
          <br />
          <span className="text-burnt-orange">Every Day</span>
        </h1>

        <p className="text-lg text-bark-light max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          Indulge in our handcrafted cakes and cookies, made with love and the finest ingredients from our small Filipino bakery.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          <button
            onClick={scrollToMenu}
            className="px-8 py-4 bg-burnt-orange text-white rounded-full text-base font-semibold shadow-lg hover:bg-burnt-orange-dark hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            data-testid="hero-order-button"
          >
            See Our Menu
          </button>
          <a
            href="https://m.me/61554594188313"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-bark rounded-full text-base font-semibold border border-soft-border hover:border-burnt-orange/30 hover:-translate-y-0.5 transition-all duration-300"
            data-testid="hero-messenger-button"
          >
            Message Us
          </a>
        </div>
      </div>
    </section>
  );
}
