import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, DollarSign, Star, ArrowLeft, Loader2, User, Crown, CreditCard, Check, Building2, Sparkles, Gem, Shield } from 'lucide-react';

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
  badgeText: string;
  shadow: string;
}> = {
  Silver: {
    gradient: 'from-gray-100 via-gray-50 to-white',
    border: 'border-gray-300',
    icon: <Shield className="w-5 h-5 text-gray-500" />,
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    shadow: 'shadow-gray-200',
  },
  Gold: {
    gradient: 'from-amber-50 via-yellow-50 to-white',
    border: 'border-amber-300',
    icon: <Crown className="w-5 h-5 text-amber-500" />,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    shadow: 'shadow-amber-200',
  },
  Platinum: {
    gradient: 'from-purple-50 via-violet-50 to-white',
    border: 'border-purple-300',
    icon: <Gem className="w-5 h-5 text-purple-500" />,
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    shadow: 'shadow-purple-200',
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
    const { data: cData, error: cError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('id', id)
      .single();

    if (!cError && cData) {
      const c = cData as any;
      setCelebrity({
        ...c,
        available_dates: Array.isArray(c.available_dates) ? c.available_dates : []
      });
    }

    const { data: mData } = await supabase
      .from('memberships')
      .select('*')
      .eq('celebrity_id', id)
      .order('price', { ascending: true });
    if (mData) {
      setMemberships((mData as any[]).map(m => ({
        ...m,
        benefits: Array.isArray(m.benefits) ? m.benefits : []
      })));
    }

    const { data: aData } = await supabase
      .from('celebrity_accounts')
      .select('*')
      .eq('celebrity_id', id)
      .eq('is_active', true)
      .single();
    if (aData) setAccount(aData as CelebrityAccount);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!celebrity) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Celebrity not found</h1>
        <Button onClick={() => navigate('/celebrities')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Browse
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => navigate('/celebrities')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Browse
      </Button>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="rounded-xl overflow-hidden bg-gray-100 aspect-[4/5]">
          {celebrity.image_url ? (
            <img src={celebrity.image_url} alt={celebrity.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User className="w-24 h-24" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {celebrity.category && (
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">{celebrity.category}</Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-2">{celebrity.name}</h1>
            {celebrity.country && (
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                {celebrity.country}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-gray-600 leading-relaxed">{celebrity.bio || 'No biography available.'}</p>
          </div>

          <Separator />

          <Tabs defaultValue="book" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="book">
                <Calendar className="w-4 h-4 mr-2" />
                Book Ticket
              </TabsTrigger>
              <TabsTrigger value="membership">
                <Crown className="w-4 h-4 mr-2" />
                Membership
              </TabsTrigger>
            </TabsList>

            <TabsContent value="book" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
                <DollarSign className="w-6 h-6" />
                {celebrity.base_price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">per ticket</span>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Available Dates</h3>
                {celebrity.available_dates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {celebrity.available_dates.map((date: string) => (
                      <Badge key={date} variant="outline" className="text-sm py-1 px-3">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(date).toLocaleDateString()}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No available dates at the moment.</p>
                )}
              </div>
              <Button size="lg" className="w-full mt-2" onClick={() => navigate(`/booking/${celebrity.id}`)}>
                <Star className="w-5 h-5 mr-2" />
                Book Now
              </Button>
            </TabsContent>

            <TabsContent value="membership" className="space-y-4 mt-4">
              {memberships.length === 0 ? (
                <p className="text-gray-500">No membership plans available.</p>
              ) : (
                <div className="space-y-3">
                  {memberships.map((m) => {
                    const style = TIER_STYLES[m.name] || TIER_STYLES.Silver;
                    return (
                      <Card
                        key={m.id}
                        className={`overflow-hidden border-2 ${style.border} bg-gradient-to-br ${style.gradient} hover:shadow-lg hover:${style.shadow} transition-all duration-300`}
                      >
                        <CardContent className="p-5">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.badgeBg}`}>
                                {style.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{m.name} Membership</h3>
                                <p className="text-sm text-gray-500">{m.duration_months} month{m.duration_months !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-indigo-700">${m.price.toLocaleString()}</div>
                              <div className="text-xs text-gray-400">total price</div>
                            </div>
                          </div>

                          <Separator className="my-3 opacity-50" />

                          {/* Benefits */}
                          <div className="grid grid-cols-1 gap-2 mb-4">
                            {m.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${style.badgeBg}`}>
                                  <Check className="w-3 h-3" />
                                </div>
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>

                          {/* Popular badge for Gold */}
                          {m.name === 'Gold' && (
                            <div className="mb-3">
                              <Badge className="bg-amber-500 text-white">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Most Popular
                              </Badge>
                            </div>
                          )}

                          {/* CTA */}
                          <Button
                            className="w-full"
                            size="lg"
                            variant={m.name === 'Platinum' ? 'default' : 'outline'}
                            onClick={() => navigate(`/booking/${celebrity.id}?membership=${m.id}`)}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Buy {m.name}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {account && (
            <>
              <Separator />
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Payment Account Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Name</span>
                      <span className="font-medium">{account.account_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Number</span>
                      <span className="font-mono font-medium text-indigo-600">{account.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-medium">{account.bank_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
