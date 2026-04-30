import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calendar, Loader2, Ticket, DollarSign, Star, CheckCircle, Building2, Upload, CreditCard, Crown, FileImage, User, ImageIcon, IdCard, Gem, Shield, Check } from 'lucide-react';

interface Celebrity {
  id: string;
  name: string;
  image_url: string | null;
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

const TIER_ICONS: Record<string, React.ReactNode> = {
  Silver: <Shield className="w-5 h-5 text-gray-500" />,
  Gold: <Crown className="w-5 h-5 text-amber-500" />,
  Platinum: <Gem className="w-5 h-5 text-purple-500" />,
};

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const membershipId = searchParams.get('membership');

  const [celebrity, setCelebrity] = useState<Celebrity | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [account, setAccount] = useState<CelebrityAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [numTickets, setNumTickets] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isMembership = !!membershipId;

  useEffect(() => {
    if (id) fetchCelebrityData();
  }, [id, membershipId]);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setCardHolderName(user.user_metadata.full_name as string);
    }
  }, [user]);

  async function fetchCelebrityData() {
    setLoading(true);
    const { data } = await supabase.from('celebrities').select('*').eq('id', id).single();
    if (data) {
      const c = data as any;
      setCelebrity({ ...c, available_dates: Array.isArray(c.available_dates) ? c.available_dates : [] });
      if (!isMembership && c.available_dates.length > 0) setSelectedDate(c.available_dates[0]);
    }

    if (membershipId) {
      const { data: mData } = await supabase.from('memberships').select('*').eq('id', membershipId).single();
      if (mData) setMembership({ ...(mData as any), benefits: Array.isArray((mData as any).benefits) ? (mData as any).benefits : [] });
    }

    const { data: aData } = await supabase.from('celebrity_accounts').select('*').eq('celebrity_id', id).eq('is_active', true).single();
    if (aData) setAccount(aData as CelebrityAccount);

    setLoading(false);
  }

  const totalPrice = isMembership && membership ? membership.price : (celebrity ? celebrity.base_price * numTickets : 0);

  function generateCardNumber(tier: string): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const tierCode = tier.charAt(0).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `STAR-${year}-${random}-${tierCode}${suffix}`;
  }

  async function uploadFile(file: File, path: string): Promise<string | null> {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('receipts').upload(fileName, file, { upsert: true });
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);
    return data?.publicUrl || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!celebrity || !user) {
      alert('You must be signed in to book.');
      return;
    }
    if (!isMembership && !selectedDate) {
      alert('Please select a date.');
      return;
    }
    if (isMembership && !cardHolderName.trim()) {
      alert('Please enter your name for the membership card.');
      return;
    }

    setSubmitting(true);
    const accountNum = account?.account_number || '';

    let uploadedPhotoUrl = null;
    if (photoFile) {
      setUploadingPhoto(true);
      uploadedPhotoUrl = await uploadFile(photoFile, 'card-photos');
      setUploadingPhoto(false);
      if (!uploadedPhotoUrl) {
        alert('Failed to upload photo. Please try again.');
        setSubmitting(false);
        return;
      }
    } else if (photoUrl) uploadedPhotoUrl = photoUrl;

    const cardNumber = isMembership && membership ? generateCardNumber(membership.name) : null;

    const bookingPayload: Record<string, any> = {
      user_id: user.id,
      celebrity_id: celebrity.id,
      membership_id: membershipId || null,
      booking_date: isMembership ? null : selectedDate,
      num_tickets: isMembership ? 0 : numTickets,
      total_price: totalPrice,
      status: 'pending',
      special_requests: specialRequests || null,
      account_number: accountNum || null,
      receipt_url: null,
      card_holder_name: isMembership ? cardHolderName : null,
      card_photo_url: uploadedPhotoUrl,
      card_number: cardNumber,
    };

    console.log('Creating booking with payload:', bookingPayload);

    const { data: bookingData, error } = await supabase.from('bookings').insert(bookingPayload).select();

    if (error) {
      console.error('Booking insert error:', error);
      alert('Failed to create booking: ' + error.message + ' (Code: ' + error.code + ')');
      setSubmitting(false);
      return;
    }

    if (!bookingData || bookingData.length === 0) {
      alert('Booking was created but no data was returned. Please check your dashboard.');
      setSubmitting(false);
      return;
    }

    const newBooking = bookingData[0] as any;
    let uploadedReceiptUrl = null;
    if (receiptFile) {
      setUploadingReceipt(true);
      uploadedReceiptUrl = await uploadFile(receiptFile, 'receipts');
      setUploadingReceipt(false);
      if (uploadedReceiptUrl) {
        const { error: updErr } = await supabase.from('bookings').update({ receipt_url: uploadedReceiptUrl }).eq('id', newBooking.id);
        if (updErr) console.error('Receipt update error:', updErr);
      }
    } else if (receiptUrl) {
      const { error: updErr } = await supabase.from('bookings').update({ receipt_url: receiptUrl }).eq('id', newBooking.id);
      if (updErr) console.error('Receipt URL update error:', updErr);
    }

    if (isMembership && membership && cardNumber) {
      const validFrom = new Date().toISOString().split('T')[0];
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + membership.duration_months);
      const cardPayload = {
        booking_id: newBooking.id,
        card_holder_name: cardHolderName,
        card_photo_url: uploadedPhotoUrl,
        card_number: cardNumber,
        celebrity_name: celebrity.name,
        tier_name: membership.name,
        valid_from: validFrom,
        valid_until: validUntil.toISOString().split('T')[0],
      };
      console.log('Creating membership card:', cardPayload);
      const { error: cardError } = await supabase.from('membership_cards').insert(cardPayload);
      if (cardError) {
        console.error('Membership card insert error:', cardError);
        alert('Booking created, but membership card generation failed: ' + cardError.message);
      }
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-black mb-3">{isMembership ? 'Membership Purchased!' : 'Booking Submitted!'}</h1>
          <p className="text-gray-600 mb-6 text-lg">
            Your {isMembership ? 'membership' : 'booking'} for <strong className="text-indigo-600">{celebrity.name}</strong> is pending admin approval.
          </p>
          {isMembership && (
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <IdCard className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-800">Your membership card is being generated</span>
              </div>
              <p className="text-sm text-purple-700">Once approved, you can view and download your personalized card from your dashboard.</p>
            </div>
          )}
          {account && (
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 mb-6 text-left rounded-xl">
              <CardContent className="py-5">
                <h3 className="font-bold text-sm mb-3 text-amber-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Payment Account Details
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-amber-700">Account Name:</span><span className="font-semibold">{account.account_name}</span></div>
                  <div className="flex justify-between"><span className="text-amber-700">Account Number:</span><span className="font-mono font-bold text-amber-900">{account.account_number}</span></div>
                  <div className="flex justify-between"><span className="text-amber-700">Bank:</span><span className="font-semibold">{account.bank_name}</span></div>
                </div>
                <p className="text-xs text-amber-600 mt-3 font-medium">Please transfer ${totalPrice.toLocaleString()} to this account.</p>
              </CardContent>
            </Card>
          )}
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-lg font-bold">
              View My Bookings
            </Button>
            <Button variant="ghost" onClick={() => navigate('/celebrities')} className="text-gray-500 h-12">
              Browse More Celebrities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(`/celebrities/${celebrity.id}`)} className="mb-6 hover:bg-white rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
        </Button>

        <Card className="rounded-3xl shadow-xl border-gray-100 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100 py-8">
            <CardTitle className="text-2xl flex items-center gap-3">
              {isMembership ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                  {membership && TIER_ICONS[membership.name]}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-black">
                {isMembership && membership ? `Buy ${membership.name} — ${celebrity.name}` : `Book ${celebrity.name}`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {isMembership && membership && (
                <Card className="bg-gradient-to-r from-purple-50 via-violet-50 to-fuchsia-50 border-purple-200 rounded-2xl">
                  <CardContent className="py-5">
                    <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2 text-lg">
                      {TIER_ICONS[membership.name]} {membership.name} Membership
                    </h3>
                    <p className="text-purple-600 font-medium mb-1">{membership.duration_months} month{membership.duration_months !== 1 ? 's' : ''}</p>
                    <ul className="space-y-1 mt-3">
                      {membership.benefits.map((b, i) => (
                        <li key={i} className="text-sm text-purple-700 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-500" /> {b}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {!isMembership && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Select Date
                    </Label>
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Choose an available date" />
                      </SelectTrigger>
                      <SelectContent>
                        {celebrity.available_dates.map((date: string) => (
                          <SelectItem key={date} value={date}>
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Ticket className="w-4 h-4" /> Number of Tickets
                    </Label>
                    <Input type="number" min={1} max={10} value={numTickets} onChange={(e) => setNumTickets(Math.max(1, Math.min(10, Number(e.target.value))))} className="h-12 rounded-xl" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Special Requests (Optional)</Label>
                <Textarea placeholder="Any special requests..." value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} className="rounded-xl" />
              </div>

              {isMembership && (
                <>
                  <Separator />
                  <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white rounded-2xl">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                        <IdCard className="w-5 h-5" /> Personalize Your Membership Card
                      </h3>
                      <p className="text-sm text-gray-500 mb-5">Enter the details for your digital membership card.</p>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 font-semibold">
                            <User className="w-4 h-4" /> Name on Card *
                          </Label>
                          <Input placeholder="Enter your full name" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} required={isMembership} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 font-semibold">
                            <ImageIcon className="w-4 h-4" /> Profile Photo for Card
                          </Label>
                          <p className="text-xs text-gray-400">Upload a photo to appear on your membership card.</p>
                          <div className="flex items-center gap-3">
                            <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                            <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} className="rounded-xl">
                              <Upload className="w-4 h-4 mr-2" />
                              {photoFile ? 'Change Photo' : 'Upload Photo'}
                            </Button>
                            {photoFile && <span className="text-sm text-gray-600">{photoFile.name}</span>}
                          </div>
                          <div className="text-center text-sm text-gray-400">— or —</div>
                          <Input placeholder="https://... (photo URL)" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="rounded-xl" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              <Separator />

              {account && (
                <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-gray-500 font-bold uppercase tracking-wider">
                      <Building2 className="w-4 h-4" /> Payment Transfer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center"><span className="text-gray-500">Account Name</span><span className="font-semibold">{account.account_name}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500">Account Number</span><span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{account.account_number}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500">Bank</span><span className="font-semibold">{account.bank_name}</span></div>
                    <p className="text-xs text-gray-400 mt-2">Transfer the exact amount below, then upload your receipt.</p>
                  </CardContent>
                </Card>
              )}

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                {!isMembership && (
                  <>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Price per ticket</span><span>${celebrity.base_price.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm mb-3"><span className="text-gray-600">Tickets</span><span>x {numTickets}</span></div>
                  </>
                )}
                <Separator className="mb-3 bg-indigo-200" />
                <div className="flex justify-between text-xl font-black text-indigo-700">
                  <span className="flex items-center gap-1"><DollarSign className="w-5 h-5" /> Total</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Payment Receipt
                </Label>
                <p className="text-xs text-gray-500">Upload a screenshot or photo of your payment receipt. Admin will verify before approval.</p>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                    <FileImage className="w-4 h-4 mr-2" />
                    {receiptFile ? 'Change File' : 'Choose File'}
                  </Button>
                  {receiptFile && <span className="text-sm text-gray-600">{receiptFile.name}</span>}
                </div>
                <div className="text-center text-sm text-gray-400">— or paste a URL —</div>
                <Input placeholder="https://... (receipt image URL)" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} className="rounded-xl" />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-indigo-200 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                disabled={submitting || uploadingReceipt || uploadingPhoto || (!isMembership && !selectedDate)}
              >
                {submitting || uploadingReceipt || uploadingPhoto ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="w-5 h-5 mr-2" /> {isMembership ? 'Buy Membership' : 'Confirm Booking'}</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
