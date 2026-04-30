import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Search, Menu, X, User, Shield, LogOut, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-black text-indigo-700 tracking-tight hover:text-indigo-800 transition">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              StarBooker
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/celebrities" className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2 transition">
              <Search className="w-4 h-4" />
              Browse
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2 transition">
                  <User className="w-4 h-4" />
                  My Bookings
                </Link>
                {profile?.is_admin && (
                  <Link to="/admin" className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2 transition">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">{profile?.full_name || profile?.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                <Button variant="ghost" onClick={() => navigate('/login')} className="font-medium">Sign In</Button>
                <Button onClick={() => navigate('/register')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">Get Started</Button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600 p-2 rounded-lg hover:bg-gray-100">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-1 shadow-lg">
          <Link to="/celebrities" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium">
            Browse Celebrities
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium">
                My Bookings
              </Link>
              {profile?.is_admin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium">
                  Admin
                </Link>
              )}
              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium text-center">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
