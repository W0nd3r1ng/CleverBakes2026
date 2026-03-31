import React from 'react';
import { Heart, Clock, Award } from 'lucide-react';

const FEATURES = [
  { icon: Heart, title: 'Made with Love', desc: 'Every recipe is perfected through years of experience and genuine passion for baking.' },
  { icon: Clock, title: 'Fresh Daily', desc: 'Our bakers wake up early every morning to create fresh, delicious treats.' },
  { icon: Award, title: 'Quality First', desc: 'We use only the finest ingredients to bring you the best homemade quality.' },
];

export default function About() {
  return (
    <section id="about" className="py-20 px-4 bg-white" data-testid="about-section">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm text-burnt-orange uppercase tracking-[0.15em] font-semibold mb-3">About Us</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-bark tracking-tight mb-6">
              A Small Family Bakery With Big Heart
            </h2>
            <p className="text-bark-light leading-relaxed mb-4">
              Welcome to Clever Bake's, where every treat is crafted with passion and care. We started as a small family business with a simple mission: to bring joy to your day through the art of baking.
            </p>
            <p className="text-bark-light leading-relaxed">
              From classic chocolate chip cookies to custom celebration cakes, each item is made with love and attention to detail. We believe good food brings people together.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-xl bg-warm-sand/50 border border-soft-border hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-burnt-orange/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="text-burnt-orange" size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-bark mb-1">{f.title}</h3>
                  <p className="text-sm text-mocha leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
