import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Star, ArrowLeft, Loader2, User, Crown, CreditCard, Check, Building2, Gem, Shield } from 'lucide-react';

interface Celebrity {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  country: string | null;
  category: string | null;
  base_price: number;
  available_dates: string[];
}

interface Membership {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  benefits: string[];
}

interface CelebrityAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
}

const TIER_STYLES: Record<string, {
  gradient: string;
  border: string;
  icon: React.ReactNode;
  badgeBg: string;
  shadow: string;
  button: string;
}> = {
  Silver: {
    gradient: 'from-gray-100 via-slate-50 to-white',
    border: 'border-gray-300',
    icon: <Shield className="w-6 h-6 text-gray-500" />,
    badgeBg: 'bg-gray-200',
    shadow: 'shadow-gray-200',
    button: 'border-gray-400 text-gray-700 hover:bg-gray-100',
  },
  Gold: {
    gradient: 'from-amber-50 via-yellow-50 to-orange-50',
    border: 'border-amber-300',
    icon: <Crown className="w-6 h-6 text-amber-500" />,
    badgeBg: 'bg-amber-200',
    shadow: 'shadow-amber-200',
    button: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:shadow-lg',
  },
  Platinum: {
    gradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
    border: 'border-purple-300',
    icon: <Gem className="w-6 h-6 text-purple-500" />,
    badgeBg: 'bg-purple-200',
    shadow: 'shadow-purple-200',
    button: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:shadow-lg',
  },
};

export default function CelebrityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [celebrity, setCelebrity] = useState<Celebrity | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [account, setAccount] = useState<CelebrityAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCelebrityData();
  }, [id]);

  async function fetchCelebrityData() {
    setLoading(true);
    const { data: cData } = await supabase.from('celebrities').select('*').eq('id', id).single();
    if (cData) {
      const c = cData as any;
      setCelebrity({ ...c, available_dates: Array.isArray(c.available_dates) ? c.available_dates : [] });
    }

    const { data: mData } = await supabase.from('memberships').select('*').eq('celebrity_id', id).order('price', { ascending: true });
    if (mData) {
      setMemberships((mData as any[]).map(m => ({ ...m, benefits: Array.isArray(m.benefits) ? m.benefits : [] })));
    }

    const { data: aData } = await supabase.from('celebrity_accounts').select('*').eq('celebrity_id', id).eq('is_active', true).single();
    if (aData) setAccount(aData as CelebrityAccount);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!celebrity) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Celebrity not found</h1>
        <Button onClick={() => navigate('/celebrities')} className="bg-indigo-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Button variant="ghost" onClick={() => navigate('/celebrities')} className="mb-6 hover:bg-white/80">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
        </Button>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="rounded-3xl overflow-hidden bg-gray-100 aspect-[3/4] shadow-2xl shadow-gray-200 relative group">
            {celebrity.image_url ? (
              <img src={celebrity.image_url} alt={celebrity.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User className="w-32 h-32" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              {celebrity.category && (
                <Badge className="bg-white/90 text-indigo-700 backdrop-blur-sm mb-2 text-sm px-3 py-1">
                  {celebrity.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-black text-gray-900 mb-3">{celebrity.name}</h1>
              {celebrity.country && (
                <div className="flex items-center gap-2 text-gray-500 text-lg">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  {celebrity.country}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-indigo-500" /> About
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">{celebrity.bio || 'No biography available.'}</p>
            </div>

            <Separator />

            <Tabs defaultValue="book" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-14 rounded-xl bg-gray-100 p-1">
                <TabsTrigger value="book" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-base font-semibold">
                  <Calendar className="w-4 h-4 mr-2" /> Book Ticket
                </TabsTrigger>
                <TabsTrigger value="membership" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-base font-semibold">
                  <Crown className="w-4 h-4 mr-2" /> Membership
                </TabsTrigger>
              </TabsList>

              <TabsContent value="book" className="space-y-5 mt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-indigo-600">${celebrity.base_price.toLocaleString()}</span>
                  <span className="text-gray-400 text-lg">per ticket</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Dates</h3>
                  {celebrity.available_dates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {celebrity.available_dates.map((date: string) => (
                        <Badge key={date} variant="outline" className="text-sm py-2 px-4 rounded-lg border-indigo-200 text-indigo-700 bg-indigo-50">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No available dates at the moment.</p>
                  )}
                </div>
                <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-14 text-lg shadow-lg shadow-indigo-200" onClick={() => navigate(`/booking/${celebrity.id}`)}>
                  <Star className="w-5 h-5 mr-2" /> Book Now
                </Button>
              </TabsContent>

              <TabsContent value="membership" className="space-y-4 mt-5">
                {memberships.length === 0 ? (
                  <p className="text-gray-500">No membership plans available.</p>
                ) : (
                  memberships.map((m) => {
                    const style = TIER_STYLES[m.name] || TIER_STYLES.Silver;
                    return (
                      <Card key={m.id} className={`overflow-hidden border-2 ${style.border} bg-gradient-to-br ${style.gradient} hover:shadow-xl hover:${style.shadow} transition-all duration-300 rounded-2xl`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${style.badgeBg} flex items-center justify-center shadow-sm`}>
                                {style.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-xl">{m.name} Membership</h3>
                                <p className="text-sm text-gray-500">{m.duration_months} month{m.duration_months !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-black text-gray-900">${m.price.toLocaleString()}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 mb-5">
                            {m.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                <div className={`w-6 h-6 rounded-full ${style.badgeBg} flex items-center justify-center flex-shrink-0`}>
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-medium">{benefit}</span>
                              </div>
                            ))}
                          </div>

                          {m.name === 'Gold' && (
                            <div className="mb-4">
                              <Badge className="bg-amber-500 text-white font-bold px-3 py-1">
                                <Star className="w-3 h-3 mr-1 fill-white" /> MOST POPULAR
                              </Badge>
                            </div>
                          )}

                          <Button
                            className={`w-full h-12 rounded-xl font-bold text-base ${style.button} transition-all`}
                            onClick={() => navigate(`/booking/${celebrity.id}?membership=${m.id}`)}
                          >
                            <CreditCard className="w-5 h-5 mr-2" />
                            Buy {m.name}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>

            {account && (
              <>
                <Separator />
                <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200 rounded-2xl">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Payment Account Info
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Account Name</span>
                        <span className="font-semibold text-gray-900">{account.account_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Account Number</span>
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{account.account_number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Bank</span>
                        <span className="font-semibold text-gray-900">{account.bank_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
