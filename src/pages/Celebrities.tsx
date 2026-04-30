import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Loader2, Star, Crown, ArrowRight, Filter, X, Heart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const CATEGORIES = ['All', 'Actor', 'Musician', 'Athlete', 'Influencer', 'Comedian', 'Model', 'Director'];
const COUNTRIES = ['All', 'USA', 'UK', 'Canada', 'Australia', 'India', 'Nigeria', 'France', 'Germany', 'Brazil', 'Japan', 'South Korea', 'Portugal', 'Argentina', 'Spain', 'Kenya', 'Hong Kong', 'Jamaica', 'Switzerland', 'Colombia', 'Barbados', 'Puerto Rico'];

const CATEGORY_COLORS: Record<string, string> = {
  Actor: 'bg-blue-100 text-blue-700 border-blue-200',
  Musician: 'bg-purple-100 text-purple-700 border-purple-200',
  Athlete: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Comedian: 'bg-orange-100 text-orange-700 border-orange-200',
  Director: 'bg-rose-100 text-rose-700 border-rose-200',
  Model: 'bg-pink-100 text-pink-700 border-pink-200',
  Influencer: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

export default function Celebrities() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCelebrities();
  }, []);

  async function fetchCelebrities() {
    setLoading(true);
    const { data, error } = await supabase.from('celebrities').select('*');
    if (!error && data) {
      setCelebrities(data.map((c: any) => ({
        ...c,
        available_dates: Array.isArray(c.available_dates) ? c.available_dates : []
      })));
    }
    setLoading(false);
  }

  const filtered = celebrities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.bio || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || c.category === category;
    const matchesCountry = country === 'All' || c.country === country;
    const matchesMin = !minPrice || c.base_price >= Number(minPrice);
    const matchesMax = !maxPrice || c.base_price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesCountry && matchesMin && matchesMax;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-16 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-3">Browse Celebrities</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">Discover and book 42+ world-famous stars from every corner of entertainment.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search celebrities by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl text-lg border-gray-200 focus:border-indigo-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 h-12 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-600 font-medium"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(category !== 'All' || country !== 'All' || minPrice || maxPrice) && (
                <Badge className="bg-indigo-500 text-white ml-1">Active</Badge>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Min Price ($)"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-11 rounded-xl"
              />
              <Input
                placeholder="Max Price ($)"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 font-medium">{filtered.length} star{filtered.length !== 1 ? 's' : ''} found</p>
              {(category !== 'All' || country !== 'All' || minPrice || maxPrice || search) && (
                <button
                  onClick={() => { setCategory('All'); setCountry('All'); setMinPrice(''); setMaxPrice(''); setSearch(''); }}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((celebrity) => (
                <Link to={`/celebrities/${celebrity.id}`} key={celebrity.id}>
                  <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {/* Image */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {celebrity.image_url ? (
                        <img
                          src={celebrity.image_url}
                          alt={celebrity.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Star className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Category badge */}
                      {celebrity.category && (
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${CATEGORY_COLORS[celebrity.category] || 'bg-gray-100 text-gray-700'}`}>
                            {celebrity.category}
                          </span>
                        </div>
                      )}

                      {/* Price badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-bold backdrop-blur-sm">
                          ${celebrity.base_price.toLocaleString()}
                        </span>
                      </div>

                      {/* Heart icon */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition">
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{celebrity.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {celebrity.country || 'International'}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{celebrity.bio || 'No bio available.'}</p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>3 tiers</span>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:gap-2 transition-all">
                          View Profile
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No celebrities found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
