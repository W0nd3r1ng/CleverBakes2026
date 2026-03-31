import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Flame } from 'lucide-react';
import { getCategories } from '../../api';

export default function Menu({ products, loading, onOrder }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    getCategories().then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  const bestsellers = useMemo(() => products.filter(p => p.is_bestseller), [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === 'bestsellers') return bestsellers;
    return products.filter(p => p.category_id === activeCategory);
  }, [products, activeCategory, bestsellers]);

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
          <div className="text-center mb-10">
            <p className="text-sm text-burnt-orange uppercase tracking-[0.15em] font-semibold mb-3">Our Treats</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-bark tracking-tight">Our Menu</h2>
          </div>

          {/* Best Sellers Highlight (only when on "All" view) */}
          {activeCategory === 'all' && bestsellers.length > 0 && (
            <div className="mb-14" data-testid="bestsellers-section">
              <div className="flex items-center gap-2 mb-6">
                <Flame className="text-burnt-orange" size={22} />
                <h3 className="font-heading text-2xl font-semibold text-bark">Best Sellers</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {bestsellers.map((product, idx) => (
                  <div
                    key={product.id || idx}
                    className="bg-white rounded-2xl overflow-hidden border-2 border-burnt-orange/20 hover:border-burnt-orange/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative"
                    data-testid={`bestseller-card-${product.id || idx}`}
                  >
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-burnt-orange text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                      <Flame size={12} /> Best Seller
                    </div>
                    <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                      <img
                        src={product.image || '/images/logo.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-bark text-sm mb-1 truncate">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-burnt-orange">&#8369;{product.price}</span>
                        <button
                          onClick={() => onOrder(product)}
                          className="px-3 py-1.5 bg-burnt-orange text-white rounded-full text-xs font-semibold hover:bg-burnt-orange-dark transition-all"
                          data-testid={`bestseller-order-${product.id || idx}`}
                        >
                          Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10" data-testid="category-filters">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === 'all'
                  ? 'bg-burnt-orange text-white shadow-md'
                  : 'bg-white text-bark-light border border-soft-border hover:border-burnt-orange/40 hover:text-burnt-orange'
              }`}
              data-testid="category-filter-all"
            >
              All
            </button>
            {bestsellers.length > 0 && (
              <button
                onClick={() => setActiveCategory('bestsellers')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                  activeCategory === 'bestsellers'
                    ? 'bg-burnt-orange text-white shadow-md'
                    : 'bg-white text-bark-light border border-soft-border hover:border-burnt-orange/40 hover:text-burnt-orange'
                }`}
                data-testid="category-filter-bestsellers"
              >
                <Flame size={14} /> Best Sellers
              </button>
            )}
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-burnt-orange text-white shadow-md'
                    : 'bg-white text-bark-light border border-soft-border hover:border-burnt-orange/40 hover:text-burnt-orange'
                }`}
                data-testid={`category-filter-${cat.id}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-mocha">
              <p className="text-lg">No products in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => (
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
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {product.is_bestseller && (
                        <span className="flex items-center gap-1 bg-burnt-orange text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                          <Flame size={11} /> Best Seller
                        </span>
                      )}
                      {product.category_id && categories.length > 0 && (() => {
                        const cat = categories.find(c => c.id === product.category_id);
                        return cat ? (
                          <span className="bg-white/90 backdrop-blur-sm text-bark text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                            {cat.name}
                          </span>
                        ) : null;
                      })()}
                    </div>
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
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedProduct(null)}>
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-xl font-bold text-bark shadow hover:bg-white transition-colors" data-testid="close-lightbox">
              &times;
            </button>
            {selectedProduct.is_bestseller && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-burnt-orange text-white text-sm font-bold px-3 py-1.5 rounded-full shadow">
                <Flame size={14} /> Best Seller
              </div>
            )}
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
