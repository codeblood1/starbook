import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UserPlus, Mail, Lock, User, Star, Sparkles } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to create account.');
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950">
        <Card className="w-full max-w-md border-gray-700/50 bg-white/5 backdrop-blur-xl shadow-2xl rounded-3xl text-center">
          <CardContent className="py-12 px-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Account Created!</h2>
            <p className="text-white/50 mb-8">Please check your email to verify your account before signing in.</p>
            <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold h-12 rounded-xl w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Create Account</h1>
          <p className="text-white/50">Join StarBooker and book your favorite stars</p>
        </div>

        <Card className="border-gray-700/50 bg-white/5 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white/70">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-12 h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-400" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-12 h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-400" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-400" required minLength={6} />
                </div>
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
              <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-base shadow-lg shadow-indigo-500/25" disabled={loading}>
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating account...</> : <><Star className="w-5 h-5 mr-2" /> Create Account</>}
              </Button>
            </form>
            <p className="text-center text-sm text-white/40 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
