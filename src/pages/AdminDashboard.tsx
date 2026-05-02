import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle, Plus, Pencil, Trash2, Star, DollarSign, MapPin, Calendar, Receipt, Building2, FileImage, Crown, Gem, Shield, ChevronUp, Save, X } from 'lucide-react';

interface BookingWithDetails {
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
  card_number: string | null;
  user: { full_name: string | null; email: string } | null;
  celebrity: { name: string } | null;
  membership: { name: string } | null;
}

interface Celebrity {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  country: string | null;
  category: string | null;
  base_price: number;
  available_dates: string[];
  created_at: string;
}

interface CelebrityAccount {
  id: string;
  celebrity_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  is_active: boolean;
  created_at: string;
}

interface Membership {
  id: string;
  celebrity_id: string;
  name: string;
  price: number;
  duration_months: number;
  benefits: string[];
  created_at: string;
}

const CATEGORIES = ['Actor', 'Musician', 'Athlete', 'Influencer', 'Comedian', 'Model', 'Director'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [accounts, setAccounts] = useState<CelebrityAccount[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCelebrity, setEditingCelebrity] = useState<Celebrity | null>(null);
  const [receiptDialog, setReceiptDialog] = useState<string | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CelebrityAccount | null>(null);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [editAccountNum, setEditAccountNum] = useState('');
  const [editAccountName, setEditAccountName] = useState('');

  const [form, setForm] = useState({
    name: '', bio: '', image_url: '', country: '', category: '', base_price: 0, available_dates: '',
  });

  const [accountForm, setAccountForm] = useState({
    celebrity_id: '', account_name: '', account_number: '', bank_name: '', is_active: true,
  });

  const [membershipForm, setMembershipForm] = useState({
    celebrity_id: '', name: 'Silver', price: 0, duration_months: 1, benefits: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [bookingsRes, celebRes, accountRes, membershipRes] = await Promise.all([
      supabase.from('bookings').select(`
        id, booking_date, num_tickets, total_price, status, special_requests, created_at, account_number, receipt_url, card_holder_name, card_number, card_photo_url,
        user:user_id (full_name, email),
        celebrity:celebrity_id (name),
        membership:membership_id (name)
      `).order('created_at', { ascending: false }),
      supabase.from('celebrities').select('*').order('created_at', { ascending: false }),
      supabase.from('celebrity_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('memberships').select('*').order('price', { ascending: true }),
    ]);

    if (bookingsRes.error) {
      console.error('Bookings fetch error:', bookingsRes.error);
      alert('Failed to load bookings: ' + bookingsRes.error.message);
    } else if (bookingsRes.data) {
      setBookings((bookingsRes.data as any[]).map(b => ({
        ...b,
        user: b.user && !Array.isArray(b.user) ? b.user : (b.user?.[0] || null),
        celebrity: b.celebrity && !Array.isArray(b.celebrity) ? b.celebrity : (b.celebrity?.[0] || null),
        membership: b.membership && !Array.isArray(b.membership) ? b.membership : (b.membership?.[0] || null),
      })));
    }
    if (celebRes.error) {
      console.error('Celebrities fetch error:', celebRes.error);
    } else if (celebRes.data) {
      setCelebrities((celebRes.data as any[]).map(c => ({
        ...c,
        available_dates: Array.isArray(c.available_dates) ? c.available_dates : []
      })));
    }
    if (accountRes.error) {
      console.error('Accounts fetch error:', accountRes.error);
    } else if (accountRes.data) {
      setAccounts(accountRes.data as CelebrityAccount[]);
    }
    if (membershipRes.error) {
      console.error('Memberships fetch error:', membershipRes.error);
    } else if (membershipRes.data) {
      setMemberships((membershipRes.data as any[]).map(m => ({
        ...m,
        benefits: Array.isArray(m.benefits) ? m.benefits : []
      })));
    }
    setLoading(false);
  }

  async function confirmBooking(id: string) {
    const { error } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b));
    } else {
      alert('Failed to confirm: ' + (error as any).message);
    }
  }

  async function cancelBooking(id: string) {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
    } else {
      alert('Failed to cancel: ' + (error as any).message);
    }
  }

  async function saveBookingAccount(id: string) {
    const { error } = await supabase.from('bookings').update({
      account_number: editAccountNum || null,
    }).eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, account_number: editAccountNum || null } : b));
      setExpandedBooking(null);
    } else {
      alert('Failed to update: ' + (error as any).message);
    }
  }

  function openEdit(celeb: Celebrity) {
    setEditingCelebrity(celeb);
    setForm({
      name: celeb.name, bio: celeb.bio || '', image_url: celeb.image_url || '',
      country: celeb.country || '', category: celeb.category || '',
      base_price: celeb.base_price,
      available_dates: Array.isArray(celeb.available_dates) ? celeb.available_dates.join(', ') : '',
    });
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingCelebrity(null);
    setForm({ name: '', bio: '', image_url: '', country: '', category: '', base_price: 0, available_dates: '' });
    setDialogOpen(true);
  }

  async function handleSaveCelebrity(e: React.FormEvent) {
    e.preventDefault();
    const dates = form.available_dates.split(',').map(d => d.trim()).filter(Boolean);
    const payload = {
      name: form.name, bio: form.bio || null, image_url: form.image_url || null,
      country: form.country || null, category: form.category || null,
      base_price: Number(form.base_price), available_dates: dates,
    };

    if (editingCelebrity) {
      const { error } = await supabase.from('celebrities').update(payload).eq('id', editingCelebrity.id);
      if (!error) {
        setCelebrities(prev => prev.map(c => c.id === editingCelebrity.id ? { ...c, ...payload, available_dates: dates } : c));
        setDialogOpen(false);
      } else { alert('Failed to update: ' + (error as any).message); }
    } else {
      const { data, error } = await supabase.from('celebrities').insert(payload).select();
      if (!error && data) {
        const newCeleb = data[0] as any;
        setCelebrities(prev => [{ ...newCeleb, available_dates: dates }, ...prev]);
        setDialogOpen(false);
      } else { alert('Failed to add: ' + (error as any).message); }
    }
  }

  async function deleteCelebrity(id: string) {
    if (!confirm('Are you sure? This will delete all associated memberships and bookings.')) return;
    const { error } = await supabase.from('celebrities').delete().eq('id', id);
    if (!error) setCelebrities(prev => prev.filter(c => c.id !== id));
  }

  function openAccountEdit(account?: CelebrityAccount) {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        celebrity_id: account.celebrity_id,
        account_name: account.account_name,
        account_number: account.account_number,
        bank_name: account.bank_name,
        is_active: account.is_active,
      });
    } else {
      setEditingAccount(null);
      setAccountForm({ celebrity_id: celebrities[0]?.id || '', account_name: '', account_number: '', bank_name: '', is_active: true });
    }
    setAccountDialogOpen(true);
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountForm.celebrity_id) { alert('Please select a celebrity.'); return; }
    if (editingAccount) {
      const { error } = await supabase.from('celebrity_accounts').update({
        celebrity_id: accountForm.celebrity_id,
        account_name: accountForm.account_name,
        account_number: accountForm.account_number,
        bank_name: accountForm.bank_name,
        is_active: accountForm.is_active,
      }).eq('id', editingAccount.id);
      if (!error) {
        setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...accountForm } : a));
        setAccountDialogOpen(false);
      } else { alert('Failed: ' + (error as any).message); }
    } else {
      const { data, error } = await supabase.from('celebrity_accounts').insert({
        celebrity_id: accountForm.celebrity_id,
        account_name: accountForm.account_name,
        account_number: accountForm.account_number,
        bank_name: accountForm.bank_name,
        is_active: accountForm.is_active,
      }).select();
      if (!error && data) {
        setAccounts(prev => [data[0] as CelebrityAccount, ...prev]);
        setAccountDialogOpen(false);
      } else { alert('Failed: ' + (error as any).message); }
    }
  }

  function openMembershipEdit(membership?: Membership) {
    if (membership) {
      setEditingMembership(membership);
      setMembershipForm({
        celebrity_id: membership.celebrity_id,
        name: membership.name,
        price: membership.price,
        duration_months: membership.duration_months,
        benefits: Array.isArray(membership.benefits) ? membership.benefits.join(', ') : '',
      });
    } else {
      setEditingMembership(null);
      setMembershipForm({ celebrity_id: celebrities[0]?.id || '', name: 'Silver', price: 0, duration_months: 1, benefits: '' });
    }
    setMembershipDialogOpen(true);
  }

  async function handleSaveMembership(e: React.FormEvent) {
    e.preventDefault();
    if (!membershipForm.celebrity_id) { alert('Please select a celebrity.'); return; }
    const benefits = membershipForm.benefits.split(',').map(b => b.trim()).filter(Boolean);
    const payload = {
      celebrity_id: membershipForm.celebrity_id,
      name: membershipForm.name,
      price: Number(membershipForm.price),
      duration_months: Number(membershipForm.duration_months),
      benefits,
    };
    if (editingMembership) {
      const { error } = await supabase.from('memberships').update(payload).eq('id', editingMembership.id);
      if (!error) {
        setMemberships(prev => prev.map(m => m.id === editingMembership.id ? { ...m, ...payload, benefits } : m));
        setMembershipDialogOpen(false);
      } else { alert('Failed: ' + (error as any).message); }
    } else {
      const { data, error } = await supabase.from('memberships').insert(payload).select();
      if (!error && data) {
        setMemberships(prev => [...prev, { ...(data[0] as any), benefits }]);
        setMembershipDialogOpen(false);
      } else { alert('Failed: ' + (error as any).message); }
    }
  }

  async function deleteMembership(id: string) {
    if (!confirm('Delete this membership tier?')) return;
    const { error } = await supabase.from('memberships').delete().eq('id', id);
    if (!error) setMemberships(prev => prev.filter(m => m.id !== id));
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">Pending</Badge>;
      case 'confirmed': return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Confirmed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">Cancelled</Badge>;
      default: return null;
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.total_price, 0),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black">Admin Dashboard</h1>
          <p className="text-gray-500">Manage bookings, celebrities, memberships, and payment accounts.</p>
        </div>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Celebrity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings', value: stats.totalBookings, color: 'text-gray-900' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-green-600' },
          { label: 'Revenue', value: '$' + stats.totalRevenue.toLocaleString(), color: 'text-indigo-600' },
        ].map((s, i) => (
          <Card key={i} className="hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="bookings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-1" /> Bookings
          </TabsTrigger>
          <TabsTrigger value="celebrities" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Star className="w-4 h-4 mr-1" /> Celebrities
          </TabsTrigger>
          <TabsTrigger value="memberships" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Crown className="w-4 h-4 mr-1" /> Memberships
          </TabsTrigger>
          <TabsTrigger value="accounts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-1" /> Accounts
          </TabsTrigger>
        </TabsList>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>
          ) : (
            <Card>
              <CardHeader><CardTitle>All Bookings & Approvals</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Customer</TableHead>
                        <TableHead>Celebrity</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Account #</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <>
                          <TableRow key={b.id} className={b.status === 'pending' ? 'bg-yellow-50/50' : ''}>
                            <TableCell>
                              <div className="font-semibold">{b.user?.full_name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{b.user?.email}</div>
                            </TableCell>
                            <TableCell className="font-semibold">{b.celebrity?.name || 'N/A'}</TableCell>
                            <TableCell>
                              {b.membership ? (
                                <Badge className={`${
                                  b.membership.name === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                                  b.membership.name === 'Gold' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  <Crown className="w-3 h-3 mr-1" />{b.membership.name}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Ticket</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-bold text-indigo-600">${b.total_price.toLocaleString()}</TableCell>
                            <TableCell className="font-mono text-xs">{b.account_number || '—'}</TableCell>
                            <TableCell>
                              {b.receipt_url ? (
                                <Button size="sm" variant="ghost" onClick={() => setReceiptDialog(b.receipt_url)}>
                                  <FileImage className="w-4 h-4 text-green-600 mr-1" />View
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(b.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                {b.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmBooking(b.id)}>
                                      <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => cancelBooking(b.id)}>
                                      <XCircle className="w-3 h-3 mr-1" /> Cancel
                                    </Button>
                                  </>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setExpandedBooking(expandedBooking === b.id ? null : b.id);
                                  setEditAccountNum(b.account_number || '');
                                  setEditAccountName(b.user?.full_name || '');
                                }}>
                                  {expandedBooking === b.id ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedBooking === b.id && (
                            <TableRow>
                              <TableCell colSpan={8} className="bg-gray-50">
                                <div className="p-4 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label className="text-xs text-gray-500">Account Number</Label>
                                      <Input value={editAccountNum} onChange={e => setEditAccountNum(e.target.value)} className="font-mono" />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-500">Customer Name</Label>
                                      <Input value={editAccountName} onChange={e => setEditAccountName(e.target.value)} />
                                    </div>
                                    <div className="flex items-end gap-2">
                                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => saveBookingAccount(b.id)}>
                                        <Save className="w-4 h-4 mr-1" /> Save
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setExpandedBooking(null)}>
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                      </Button>
                                    </div>
                                  </div>
                                  {b.card_number && (
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <Gem className="w-4 h-4 text-purple-600" />
                                        <span className="font-semibold text-purple-800">Membership Card:</span>
                                        <span className="font-mono text-purple-700">{b.card_number}</span>
                                      </div>
                                      {b.card_holder_name && (
                                        <div className="text-sm text-purple-600 mt-1">Holder: {b.card_holder_name}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {bookings.length === 0 && <div className="text-center py-10 text-gray-500">No bookings found.</div>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CELEBRITIES TAB */}
        <TabsContent value="celebrities">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {celebrities.map((c) => (
              <Card key={c.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="aspect-[16/9] bg-gray-100">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Star className="w-12 h-12" /></div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{c.name}</h3>
                      {c.category && <Badge variant="secondary" className="text-xs">{c.category}</Badge>}
                    </div>
                    <div className="font-bold text-indigo-600">${c.base_price.toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.country || 'Unknown'}</div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{c.bio || 'No bio.'}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3" />
                    {c.available_dates.length} date{c.available_dates.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(c)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => deleteCelebrity(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {celebrities.length === 0 && <div className="text-center py-10 text-gray-500">No celebrities found.</div>}
        </TabsContent>

        {/* MEMBERSHIPS TAB */}
        <TabsContent value="memberships">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openMembershipEdit()} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Membership Tier
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5" />Membership Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Celebrity</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Benefits</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((m) => {
                      const celeb = celebrities.find(c => c.id === m.celebrity_id);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-semibold">{celeb?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge className={`${
                              m.name === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                              m.name === 'Gold' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {m.name === 'Platinum' && <Gem className="w-3 h-3 mr-1" />}
                              {m.name === 'Gold' && <Crown className="w-3 h-3 mr-1" />}
                              {m.name === 'Silver' && <Shield className="w-3 h-3 mr-1" />}
                              {m.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">${m.price.toLocaleString()}</TableCell>
                          <TableCell>{m.duration_months} mo</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {m.benefits.map((b, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{b}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openMembershipEdit(m)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => deleteMembership(m.id)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {memberships.length === 0 && <div className="text-center py-10 text-gray-500">No memberships found.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACCOUNTS TAB */}
        <TabsContent value="accounts">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openAccountEdit()} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Account
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Celebrity Payment Accounts</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Celebrity</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((a) => {
                      const celeb = celebrities.find(c => c.id === a.celebrity_id);
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-semibold">{celeb?.name || 'Unknown'}</TableCell>
                          <TableCell>{a.account_name}</TableCell>
                          <TableCell className="font-mono font-bold text-indigo-600">{a.account_number}</TableCell>
                          <TableCell>{a.bank_name}</TableCell>
                          <TableCell>
                            {a.is_active ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openAccountEdit(a)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {accounts.length === 0 && <div className="text-center py-10 text-gray-500">No payment accounts found.</div>}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptDialog} onOpenChange={() => setReceiptDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" /> Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptDialog && (
            <div className="mt-2">
              <img src={receiptDialog} alt="Receipt" className="w-full rounded-lg border" />
              <div className="flex justify-center mt-3">
                <Button variant="outline" onClick={() => window.open(receiptDialog!, '_blank')}>Open in New Tab</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Celebrity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCelebrity ? 'Edit Celebrity' : 'Add New Celebrity'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCelebrity} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
              <div className="space-y-2"><Label>Category</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select...</option>{CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Base Price *</Label><Input type="number" min={0} value={form.base_price} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} required /></div>
            <div className="space-y-2"><Label className="flex items-center gap-1"><Calendar className="w-3 h-3" />Available Dates (comma-separated)</Label><Input value={form.available_dates} onChange={e => setForm({ ...form, available_dates: e.target.value })} placeholder="2025-06-15, 2025-07-01" /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">{editingCelebrity ? 'Save Changes' : 'Add Celebrity'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />{editingAccount ? 'Edit Payment Account' : 'Add Payment Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAccount} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Celebrity *</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={accountForm.celebrity_id} onChange={e => setAccountForm({ ...accountForm, celebrity_id: e.target.value })} required>
                <option value="">Select a celebrity...</option>
                {celebrities.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="space-y-2"><Label>Account Name *</Label><Input value={accountForm.account_name} onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Account Number *</Label><Input value={accountForm.account_number} onChange={e => setAccountForm({ ...accountForm, account_number: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Bank Name *</Label><Input value={accountForm.bank_name} onChange={e => setAccountForm({ ...accountForm, bank_name: e.target.value })} required /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={accountForm.is_active} onChange={e => setAccountForm({ ...accountForm, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
              <Label htmlFor="is_active" className="mb-0">Active Account</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">{editingAccount ? 'Save Account' : 'Add Account'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Membership Dialog */}
      <Dialog open={membershipDialogOpen} onOpenChange={setMembershipDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5" />{editingMembership ? 'Edit Membership' : 'Add Membership Tier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMembership} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Celebrity *</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={membershipForm.celebrity_id} onChange={e => setMembershipForm({ ...membershipForm, celebrity_id: e.target.value })} required>
                <option value="">Select a celebrity...</option>
                {celebrities.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tier Name *</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={membershipForm.name} onChange={e => setMembershipForm({ ...membershipForm, name: e.target.value })} required>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div className="space-y-2"><Label className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Price *</Label><Input type="number" min={0} value={membershipForm.price} onChange={e => setMembershipForm({ ...membershipForm, price: Number(e.target.value) })} required /></div>
            <div className="space-y-2"><Label>Duration (months) *</Label><Input type="number" min={1} max={24} value={membershipForm.duration_months} onChange={e => setMembershipForm({ ...membershipForm, duration_months: Number(e.target.value) })} required /></div>
            <div className="space-y-2"><Label>Benefits (comma-separated)</Label><Input value={membershipForm.benefits} onChange={e => setMembershipForm({ ...membershipForm, benefits: e.target.value })} placeholder="Priority booking, Signed photo, Newsletter" /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setMembershipDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">{editingMembership ? 'Save Tier' : 'Add Tier'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
