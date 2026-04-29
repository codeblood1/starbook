import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Users, Globe, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Book Your Favorite Celebrity
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 mb-10 max-w-3xl mx-auto">
            Meet the stars you admire. From actors and musicians to athletes and influencers — book exclusive experiences with celebrities worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/celebrities">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-gray-100 px-8 py-6 text-lg">
                Browse Celebrities
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14 text-gray-800">Why StarBooker?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center p-6 rounded-xl bg-gray-50 border hover:shadow-lg transition">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Stars</h3>
              <p className="text-gray-600">Access celebrities from over 50 countries across every entertainment category.</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50 border hover:shadow-lg transition">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
              <p className="text-gray-600">Select your preferred date, choose tickets, and confirm in minutes.</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50 border hover:shadow-lg transition">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Profiles</h3>
              <p className="text-gray-600">Every celebrity is verified with real bios, photos, and availability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Meet a Star?</h2>
          <p className="text-gray-300 mb-8 text-lg">Create your free account and start browsing celebrities today.</p>
          <Link to="/register">
            <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 px-8">
              <Star className="w-5 h-5 mr-2" />
              Sign Up Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
