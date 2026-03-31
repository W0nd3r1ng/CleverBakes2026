import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Menu({ products, loading, onOrder }) {
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (loading) {
    return (
      <section id="menu" className="py-20 px-4 bg-cream" data-testid="menu-section">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-burnt-orange" size={32} />
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="menu" className="py-20 px-4 bg-cream" data-testid="menu-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm text-burnt-orange uppercase tracking-[0.15em] font-semibold mb-3">Our Treats</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-bark tracking-tight">Our Menu</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <div
                key={product.id || idx}
                className="bg-white rounded-2xl overflow-hidden border border-soft-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                data-testid={`product-card-${product.id || idx}`}
              >
                <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <img
                    src={product.image || '/images/logo.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-semibold text-bark mb-1">{product.name}</h3>
                  <p className="text-sm text-mocha mb-3 line-clamp-2">{product.description}</p>

                  {((product.variations && product.variations.length > 0) || (product.sizes && product.sizes.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(product.variations || []).filter(v => v && v !== '0').map(v => (
                        <span key={v} className="text-xs bg-ube/10 text-ube px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                      {(product.sizes || []).filter(s => s && s !== '0').map(s => (
                        <span key={s} className="text-xs bg-warm-sand text-bark-light px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-burnt-orange">&#8369;{product.price}</span>
                    <button
                      onClick={() => onOrder(product)}
                      className="px-4 py-2 bg-burnt-orange/10 text-burnt-orange rounded-full text-sm font-semibold hover:bg-burnt-orange hover:text-white transition-all duration-300"
                      data-testid={`order-button-${product.id || idx}`}
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedProduct(null)}>
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-xl font-bold text-bark shadow hover:bg-white transition-colors" data-testid="close-lightbox">
              &times;
            </button>
            <img src={selectedProduct.image || '/images/logo.jpg'} alt={selectedProduct.name} className="w-full h-80 md:h-[450px] object-contain bg-warm-sand" />
            <div className="p-6">
              <h3 className="font-heading text-2xl font-semibold text-bark mb-2">{selectedProduct.name}</h3>
              <p className="text-mocha mb-4">{selectedProduct.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-burnt-orange">&#8369;{selectedProduct.price}</span>
                <button
                  onClick={() => { setSelectedProduct(null); onOrder(selectedProduct); }}
                  className="px-6 py-3 bg-burnt-orange text-white rounded-full font-semibold hover:bg-burnt-orange-dark transition-all"
                  data-testid="lightbox-order-button"
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
