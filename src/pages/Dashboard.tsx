import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Calendar, Ticket, DollarSign, Star, ArrowRight, Clock, CheckCircle, XCircle, Receipt, Building2, Upload, Crown, FileImage, IdCard, Download, User, Shield, Gem } from 'lucide-react';

interface BookingWithCelebrity {
  id: string;
  booking_date: string | null;
  num_tickets: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  special_requests: string | null;
  created_at: string;
  account_number: string | null;
  receipt_url: string | null;
  card_holder_name: string | null;
  card_photo_url: string | null;
  card_number: string | null;
  membership_id: string | null;
  celebrity: {
    id: string;
    name: string;
    image_url: string | null;
    country: string | null;
    category: string | null;
  } | null;
  membership: {
    name: string;
    duration_months: number;
  } | null;
}

interface MembershipCardRecord {
  id: string;
  card_holder_name: string;
  card_photo_url: string | null;
  card_number: string;
  celebrity_name: string;
  tier_name: string;
  valid_from: string;
  valid_until: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithCelebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptDialog, setReceiptDialog] = useState<string | null>(null);
  const [cardDialog, setCardDialog] = useState<MembershipCardRecord | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, booking_date, num_tickets, total_price, status, special_requests, created_at, account_number, receipt_url, card_holder_name, card_photo_url, card_number, membership_id,
        celebrity:celebrity_id (id, name, image_url, country, category),
        membership:membership_id (name, duration_months)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted = (data as any[]).map((b: any) => ({
        ...b,
        celebrity: b.celebrity && !Array.isArray(b.celebrity) ? b.celebrity : (b.celebrity?.[0] || null),
        membership: b.membership && !Array.isArray(b.membership) ? b.membership : (b.membership?.[0] || null)
      }));
      setBookings(formatted);
    }
    setLoading(false);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Pending</Badge>;
      case 'confirmed': return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Confirmed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Cancelled</Badge>;
      default: return null;
    }
  };

  function getTierColor(tier: string) {
    switch (tier) {
      case 'Silver': return 'from-gray-300 to-gray-100 text-gray-800';
      case 'Gold': return 'from-amber-400 to-yellow-200 text-amber-900';
      case 'Platinum': return 'from-purple-500 to-violet-300 text-purple-900';
      default: return 'from-gray-300 to-gray-100 text-gray-800';
    }
  }

  function getTierBorder(tier: string) {
    switch (tier) {
      case 'Silver': return 'border-gray-400';
      case 'Gold': return 'border-amber-400';
      case 'Platinum': return 'border-purple-400';
      default: return 'border-gray-400';
    }
  }

  async function viewCard(bookingId: string) {
    const { data, error } = await supabase
      .from('membership_cards')
      .select('*')
      .eq('booking_id', bookingId)
      .single();
    if (!error && data) {
      setCardDialog(data as MembershipCardRecord);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
      <p className="text-gray-500 mb-8">Manage and track your celebrity bookings and memberships.</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
            <p className="text-gray-500 mb-6">Start by browsing our celebrity listings and book your favorite star.</p>
            <Button onClick={() => navigate('/celebrities')}>
              Browse Celebrities
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Celebrity Image */}
                  <div className="w-full md:w-48 h-48 md:h-auto bg-gray-100 flex-shrink-0">
                    {booking.celebrity?.image_url ? (
                      <img src={booking.celebrity.image_url} alt={booking.celebrity?.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Star className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold">{booking.celebrity?.name || 'Unknown Celebrity'}</h3>
                          {booking.membership && (
                            <Badge className="bg-purple-100 text-purple-700">
                              <Crown className="w-3 h-3 mr-1" />
                              {booking.membership.name}
                            </Badge>
                          )}
                        </div>
                        {booking.celebrity?.category && (
                          <span className="text-sm text-gray-500">{booking.celebrity.category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(booking.status)}
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>

                    <div className="border-t my-2" />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {booking.booking_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {booking.num_tickets > 0 && (
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-gray-400" />
                          <span>{booking.num_tickets} ticket{booking.num_tickets !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-indigo-600">${booking.total_price.toLocaleString()}</span>
                      </div>
                    </div>

                    {booking.account_number && (
                      <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Paid to:</span>
                        <span className="font-mono font-medium">{booking.account_number}</span>
                      </div>
                    )}

                    {booking.card_number && (
                      <div className="flex items-center gap-2 text-sm bg-purple-50 p-2 rounded">
                        <IdCard className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-500">Card #:</span>
                        <span className="font-mono font-medium text-purple-700">{booking.card_number}</span>
                      </div>
                    )}

                    {booking.special_requests && (
                      <div className="bg-gray-50 p-3 rounded-lg text-sm">
                        <span className="font-medium">Special Requests:</span>{' '}
                        <span className="text-gray-600">{booking.special_requests}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {booking.receipt_url ? (
                        <Button size="sm" variant="outline" onClick={() => setReceiptDialog(booking.receipt_url)}>
                          <FileImage className="w-4 h-4 mr-1" />
                          View Receipt
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-orange-500">
                          <Upload className="w-4 h-4" />
                          Receipt pending upload
                        </div>
                      )}
                      
                      {booking.membership && booking.card_number && booking.status === 'confirmed' && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => viewCard(booking.id)}>
                          <IdCard className="w-4 h-4 mr-1" />
                          View Card
                        </Button>
                      )}
                      
                      <span className="text-xs text-gray-400">
                        Booked on {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Receipt Dialog */}
      <Dialog open={!!receiptDialog} onOpenChange={() => setReceiptDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptDialog && (
            <div className="mt-2">
              <img src={receiptDialog} alt="Receipt" className="w-full rounded-lg border" />
              <div className="flex justify-center mt-3">
                <Button variant="outline" onClick={() => window.open(receiptDialog!, '_blank')}>
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Membership Card Dialog */}
      <Dialog open={!!cardDialog} onOpenChange={() => setCardDialog(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {cardDialog && (
            <div className={`relative bg-gradient-to-br ${getTierColor(cardDialog.tier_name)} border-2 ${getTierBorder(cardDialog.tier_name)} rounded-xl overflow-hidden`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
              </div>

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-current" />
                    <span className="font-bold text-lg tracking-wider">STARBOOKER</span>
                  </div>
                  <Badge className="bg-white/50 text-current font-bold text-xs">
                    {cardDialog.tier_name.toUpperCase()}
                  </Badge>
                </div>

                {/* Photo */}
                {cardDialog.card_photo_url ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/50 mx-auto mb-4 shadow-lg">
                    <img src={cardDialog.card_photo_url} alt="Member" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center mx-auto mb-4 border-4 border-white/50">
                    <User className="w-10 h-10 text-current/60" />
                  </div>
                )}

                {/* Member Info */}
                <div className="text-center mb-4">
                  <h3 className="font-bold text-xl">{cardDialog.card_holder_name}</h3>
                  <p className="text-sm opacity-75">{cardDialog.celebrity_name} Fan Club</p>
                </div>

                {/* Card Number */}
                <div className="bg-white/30 rounded-lg p-3 mb-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-1">
                    <IdCard className="w-4 h-4 text-current/60" />
                    <span className="font-mono text-sm font-bold tracking-widest">{cardDialog.card_number}</span>
                  </div>
                </div>

                {/* Validity */}
                <div className="flex justify-between text-xs opacity-70">
                  <div>
                    <span className="block font-semibold">VALID FROM</span>
                    <span>{new Date(cardDialog.valid_from).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-semibold">VALID UNTIL</span>
                    <span>{new Date(cardDialog.valid_until).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-current/20 flex items-center justify-between">
                  <span className="text-xs font-semibold opacity-60">MEMBERSHIP CARD</span>
                  {cardDialog.tier_name === 'Gold' && <Crown className="w-5 h-5 text-amber-600" />}
                  {cardDialog.tier_name === 'Platinum' && <Gem className="w-5 h-5 text-purple-600" />}
                  {cardDialog.tier_name === 'Silver' && <Shield className="w-5 h-5 text-gray-500" />}
                </div>
              </div>

              {/* Download button */}
              <div className="bg-white/20 p-3 flex justify-center backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-current font-semibold"
                  onClick={() => alert('Screenshot this card to save it!')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save Card
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
