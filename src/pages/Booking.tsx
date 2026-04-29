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
import { ArrowLeft, Calendar, Loader2, Ticket, DollarSign, Star, CheckCircle, Building2, Upload, CreditCard, Crown, FileImage, User, ImageIcon, IdCard } from 'lucide-react';

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
    const { data, error } = await supabase
      .from('celebrities')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) {
      const c = data as any;
      const celeb: Celebrity = {
        ...c,
        available_dates: Array.isArray(c.available_dates) ? c.available_dates : []
      };
      setCelebrity(celeb);
      if (!isMembership && celeb.available_dates.length > 0) {
        setSelectedDate(celeb.available_dates[0]);
      }
    }

    if (membershipId) {
      const { data: mData } = await supabase
        .from('memberships')
        .select('*')
        .eq('id', membershipId)
        .single();
      if (mData) {
        setMembership({
          ...(mData as any),
          benefits: Array.isArray((mData as any).benefits) ? (mData as any).benefits : []
        });
      }
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

  const totalPrice = isMembership && membership
    ? membership.price
    : (celebrity ? celebrity.base_price * numTickets : 0);

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
    
    const { error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);
    return data?.publicUrl || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!celebrity || !user) return;
    if (!isMembership && !selectedDate) return;
    if (isMembership && !cardHolderName.trim()) {
      alert('Please enter your name for the membership card.');
      return;
    }

    setSubmitting(true);
    const accountNum = account?.account_number || '';

    // Upload photo if selected
    let uploadedPhotoUrl = null;
    if (photoFile) {
      setUploadingPhoto(true);
      uploadedPhotoUrl = await uploadFile(photoFile, 'card-photos');
      setUploadingPhoto(false);
    } else if (photoUrl) {
      uploadedPhotoUrl = photoUrl;
    }

    // Generate card number for memberships
    const cardNumber = isMembership && membership
      ? generateCardNumber(membership.name)
      : null;

    const { data: bookingData, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      celebrity_id: celebrity.id,
      membership_id: membershipId || null,
      booking_date: isMembership ? null : selectedDate,
      num_tickets: isMembership ? 0 : numTickets,
      total_price: totalPrice,
      status: 'pending',
      special_requests: specialRequests || null,
      account_number: accountNum,
      receipt_url: null,
      card_holder_name: isMembership ? cardHolderName : null,
      card_photo_url: uploadedPhotoUrl,
      card_number: cardNumber,
    } as any).select();

    if (!error && bookingData && bookingData.length > 0) {
      const newBooking = bookingData[0] as any;

      // Upload receipt if selected
      let uploadedReceiptUrl = null;
      if (receiptFile) {
        setUploadingReceipt(true);
        uploadedReceiptUrl = await uploadFile(receiptFile, 'receipts');
        setUploadingReceipt(false);
      } else if (receiptUrl) {
        uploadedReceiptUrl = receiptUrl;
      }

      if (uploadedReceiptUrl) {
        await supabase
          .from('bookings')
          .update({ receipt_url: uploadedReceiptUrl } as any)
          .eq('id', newBooking.id);
      }

      // Create membership_card record for memberships
      if (isMembership && membership && cardNumber) {
        const validFrom = new Date().toISOString().split('T')[0];
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + membership.duration_months);
        
        await supabase.from('membership_cards').insert({
          booking_id: newBooking.id,
          card_holder_name: cardHolderName,
          card_photo_url: uploadedPhotoUrl,
          card_number: cardNumber,
          celebrity_name: celebrity.name,
          tier_name: membership.name,
          valid_from: validFrom,
          valid_until: validUntil.toISOString().split('T')[0],
        } as any);
      }

      setSuccess(true);
    } else {
      alert('Failed to create booking. Please try again.');
    }
    setSubmitting(false);
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

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-xl shadow-sm border p-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{isMembership ? 'Membership Purchased!' : 'Booking Submitted!'}</h1>
          <p className="text-gray-600 mb-4">
            Your {isMembership ? 'membership' : 'booking'} for <strong>{celebrity.name}</strong> is pending admin approval.
          </p>
          {isMembership && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <IdCard className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800">Your membership card is being generated</span>
              </div>
              <p className="text-sm text-purple-700">Once approved, you can view and download your personalized card from your dashboard.</p>
            </div>
          )}
          {account && (
            <Card className="bg-yellow-50 border-yellow-200 mb-6 text-left">
              <CardContent className="py-4">
                <h3 className="font-semibold text-sm mb-2 text-yellow-800">Payment Account Details</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Account Name:</span><span className="font-medium">{account.account_name}</span></div>
                  <div className="flex justify-between"><span>Account Number:</span><span className="font-mono font-medium">{account.account_number}</span></div>
                  <div className="flex justify-between"><span>Bank:</span><span className="font-medium">{account.bank_name}</span></div>
                </div>
                <p className="text-xs text-yellow-700 mt-2">Please transfer ${totalPrice.toLocaleString()} to this account.</p>
              </CardContent>
            </Card>
          )}
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/dashboard')}>
              View My Bookings
            </Button>
            <Button variant="ghost" onClick={() => navigate('/celebrities')}>
              Browse More Celebrities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => navigate(`/celebrities/${celebrity.id}`)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Profile
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            {isMembership ? <Crown className="w-6 h-6 text-purple-600" /> : <Star className="w-6 h-6 text-indigo-600" />}
            {isMembership && membership ? `Buy ${membership.name} - ${celebrity.name}` : `Book ${celebrity.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {isMembership && membership && (
              <Card className="bg-gradient-to-br from-purple-50 via-violet-50 to-white border-purple-200">
                <CardContent className="py-4">
                  <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    {membership.name} Membership
                  </h3>
                  <p className="text-sm text-purple-700 mb-1">{membership.duration_months} month{membership.duration_months !== 1 ? 's' : ''}</p>
                  <ul className="space-y-1">
                    {membership.benefits.map((b, i) => (
                      <li key={i} className="text-sm text-purple-700">• {b}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Date Selection - only for ticket bookings */}
            {!isMembership && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Select Date
                </Label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
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
            )}

            {/* Tickets - only for ticket bookings */}
            {!isMembership && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Number of Tickets
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={numTickets}
                  onChange={(e) => setNumTickets(Math.max(1, Math.min(10, Number(e.target.value))))}
                />
              </div>
            )}

            {/* Special Requests */}
            <div className="space-y-2">
              <Label>Special Requests (Optional)</Label>
              <Textarea
                placeholder="Any special requests for your booking..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
              />
            </div>

            {/* Membership Card Personalization - only for memberships */}
            {isMembership && (
              <>
                <Separator />
                <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                      <IdCard className="w-5 h-5" />
                      Personalize Your Membership Card
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Enter the details you'd like displayed on your digital membership card.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Name on Card *
                        </Label>
                        <Input
                          placeholder="Enter your full name"
                          value={cardHolderName}
                          onChange={(e) => setCardHolderName(e.target.value)}
                          required={isMembership}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Profile Photo for Card (Optional)
                        </Label>
                        <p className="text-xs text-gray-500">Upload a photo to appear on your membership card.</p>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            ref={photoInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => photoInputRef.current?.click()}
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {photoFile ? 'Change Photo' : 'Upload Photo'}
                          </Button>
                          {photoFile && (
                            <span className="text-sm text-gray-600">{photoFile.name}</span>
                          )}
                        </div>
                        
                        <div className="text-center text-sm text-gray-400">— or paste a URL —</div>
                        <Input
                          placeholder="https://... (photo URL)"
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Separator />

            {/* Payment Account Info */}
            {account && (
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    Payment Transfer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Account Name:</span><span className="font-medium">{account.account_name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Account Number:</span><span className="font-mono font-medium text-indigo-600">{account.account_number}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Bank:</span><span className="font-medium">{account.bank_name}</span></div>
                  <p className="text-xs text-gray-400 mt-2">Transfer the exact amount below to this account, then upload your receipt.</p>
                </CardContent>
              </Card>
            )}

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {!isMembership && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Price per ticket</span>
                    <span>${celebrity.base_price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tickets</span>
                    <span>x {numTickets}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold text-indigo-600">
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> Total</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Payment Receipt
              </Label>
              <p className="text-xs text-gray-500">Upload a screenshot or photo of your payment receipt. Admin will verify before approval.</p>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  {receiptFile ? 'Change File' : 'Choose File'}
                </Button>
                {receiptFile && (
                  <span className="text-sm text-gray-600">{receiptFile.name}</span>
                )}
              </div>
              
              <div className="text-center text-sm text-gray-400">— or paste a URL —</div>
              
              <Input
                placeholder="https://... (receipt image URL)"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || uploadingReceipt || uploadingPhoto || (!isMembership && !selectedDate)}
            >
              {submitting || uploadingReceipt || uploadingPhoto ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isMembership ? 'Buy Membership' : 'Confirm Booking'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
