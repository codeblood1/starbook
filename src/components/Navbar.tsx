import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Search, Menu, X, User, Shield, LogOut, Star } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
              <Star className="w-6 h-6" />
              StarBooker
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/celebrities" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
              <Search className="w-4 h-4" />
              Browse Celebrities
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                  <User className="w-4 h-4" />
                  My Bookings
                </Link>
                {profile?.is_admin && (
                  <Link to="/admin" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{profile?.full_name || profile?.email}</span>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-1">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
                <Button onClick={() => navigate('/register')}>Get Started</Button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          <Link to="/celebrities" onClick={() => setMobileOpen(false)} className="block text-gray-600 hover:text-indigo-600 font-medium">
            Browse Celebrities
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-gray-600 hover:text-indigo-600 font-medium">
                My Bookings
              </Link>
              {profile?.is_admin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-gray-600 hover:text-indigo-600 font-medium">
                  Admin
                </Link>
              )}
              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block text-red-600 font-medium">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-gray-600 hover:text-indigo-600 font-medium">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block text-indigo-600 font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
