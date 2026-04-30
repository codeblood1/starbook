import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Globe, Play, Heart, Ticket, ArrowRight, Sparkles, Crown } from 'lucide-react';

export default function Home() {
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeatured();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function fetchFeatured() {
    const { data } = await supabase
      .from('celebrities')
      .select('*')
      .order('base_price', { ascending: false })
      .limit(4);
    if (data) setCelebrities(data);
  }

  return (
    <div>
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #4f46e5 0%, #1e1b4b 40%, #0f0a1e 100%)`,
        }}
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, _i) => (
            <div
              key={_i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            Over 42 world-famous celebrities available
            <Sparkles className="w-4 h-4" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 text-white tracking-tight">
            Meet Your
            <span className="block bg-gradient-to-r from-amber-300 via-orange-300 to-pink-400 bg-clip-text text-transparent">
              Favorite Stars
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Book exclusive experiences with Hollywood icons, global musicians, legendary athletes, and cultural icons. Your backstage pass to the stars.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/celebrities">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-white/90 px-10 py-7 text-lg font-bold shadow-2xl shadow-white/20 rounded-xl">
                <Crown className="w-5 h-5 mr-2" />
                Browse Celebrities
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-7 text-lg rounded-xl backdrop-blur-sm">
                <Star className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">42+</div>
              <div className="text-sm text-white/50">Celebrities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">20+</div>
              <div className="text-sm text-white/50">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">3</div>
              <div className="text-sm text-white/50">Membership Tiers</div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Featured Celebrities */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Featured Stars</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Handpicked celebrities available for exclusive bookings right now.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {celebrities.map((c) => (
              <Link to={`/celebrities/${c.id}`} key={c.id}>
                <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={c.image_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop'}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                        {c.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-white text-xs font-medium">
                        ${c.base_price.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{c.name}</h3>
                    <p className="text-sm text-white/70">{c.country}</p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/celebrities">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-xl">
                View All Celebrities
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500">Three simple steps to meet your idol.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Globe className="w-8 h-8" />, title: 'Browse & Choose', desc: 'Explore 42+ verified celebrities. Filter by country, category, or price to find your perfect match.', color: 'from-blue-500 to-indigo-500', step: '01' },
              { icon: <Ticket className="w-8 h-8" />, title: 'Book or Join', desc: 'Buy a ticket for an event or purchase a Silver, Gold, or Platinum membership for exclusive perks.', color: 'from-amber-500 to-orange-500', step: '02' },
              { icon: <Calendar className="w-8 h-8" />, title: 'Meet Your Star', desc: 'Upload your payment receipt, get admin approval, and receive your personalized membership card.', color: 'from-emerald-500 to-teal-500', step: '03' },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -top-4 -left-4 text-7xl font-black text-gray-100 group-hover:text-gray-200 transition-colors">
                  {item.step}
                </div>
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Tiers Preview */}
      <section className="py-24 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Membership Tiers</h2>
            <p className="text-lg text-gray-400">Unlock exclusive perks with every level.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Silver', price: 'From $9,000', features: ['Priority booking', 'Signed photo', 'Exclusive newsletter'], color: 'border-gray-400', bg: 'from-gray-700 to-gray-800', badge: 'bg-gray-500' },
              { name: 'Gold', price: 'From $22,500', features: ['All Silver perks', 'Monthly video message', 'Meet & greet access', 'Early event access'], color: 'border-amber-400', bg: 'from-amber-600 to-amber-700', badge: 'bg-amber-500', popular: true },
              { name: 'Platinum', price: 'From $54,000', features: ['All Gold perks', 'Private virtual meetup', 'Personalized video', 'VIP merchandise', 'Direct message priority'], color: 'border-purple-400', bg: 'from-purple-600 to-purple-700', badge: 'bg-purple-500' },
            ].map((tier, i) => (
              <div key={i} className={`relative rounded-2xl border-2 ${tier.color} p-8 ${tier.popular ? 'scale-105 shadow-2xl' : 'opacity-90'} hover:opacity-100 transition-all`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white text-sm font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.bg} flex items-center justify-center mb-6`}>
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                <p className="text-3xl font-black text-white mb-6">{tier.price}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-300">
                      <div className={`w-5 h-5 rounded-full ${tier.badge} flex items-center justify-center flex-shrink-0`}>
                        <Star className="w-3 h-3 text-white" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/celebrities">
                  <Button className={`w-full bg-gradient-to-r ${tier.bg} hover:brightness-110 text-white font-bold rounded-xl`}>
                    Explore Celebrities
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Fan Stories</h2>
            <p className="text-lg text-gray-500">Real experiences from our community.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah M.', location: 'New York, USA', text: 'I booked a Gold membership with Beyoncé and got a personalized video message. It was absolutely surreal!', avatar: 'SM' },
              { name: 'James K.', location: 'London, UK', text: 'The Silver membership with Idris Elba gave me priority booking for his next premiere. Incredible service.', avatar: 'JK' },
              { name: 'Aisha O.', location: 'Lagos, Nigeria', text: 'Burna Boy membership exceeded my expectations. The meet & greet was the highlight of my year.', avatar: 'AO' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Meet a Star?</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Join thousands of fans who've already booked their dream celebrity experience. Your star is waiting.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 px-10 py-7 text-lg font-bold rounded-xl shadow-2xl">
                <Sparkles className="w-5 h-5 mr-2" />
                Sign Up Free
              </Button>
            </Link>
            <Link to="/celebrities">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-7 text-lg rounded-xl">
                <Play className="w-5 h-5 mr-2" />
                Browse Stars
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
