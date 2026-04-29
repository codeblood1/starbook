import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Loader2, Star } from 'lucide-react';
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
const COUNTRIES = ['All', 'USA', 'UK', 'Canada', 'Australia', 'India', 'Nigeria', 'France', 'Germany', 'Brazil', 'Japan', 'South Korea'];

export default function Celebrities() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

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
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Browse Celebrities</h1>
      <p className="text-gray-500 mb-8">Find and book your favorite stars from around the world.</p>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
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
          />
          <Input
            placeholder="Max Price ($)"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filtered.length} celebrity{filtered.length !== 1 ? 'ies' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((celebrity) => (
              <Link to={`/celebrities/${celebrity.id}`} key={celebrity.id}>
                <Card className="overflow-hidden hover:shadow-lg transition group h-full">
                  <div className="aspect-[4/3] bg-gray-200 overflow-hidden">
                    {celebrity.image_url ? (
                      <img
                        src={celebrity.image_url}
                        alt={celebrity.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Star className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{celebrity.name}</h3>
                      {celebrity.category && (
                        <Badge variant="secondary" className="text-xs">{celebrity.category}</Badge>
                      )}
                    </div>
                    {celebrity.country && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        {celebrity.country}
                      </div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{celebrity.bio || 'No bio available.'}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-600">${celebrity.base_price.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">per ticket</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No celebrities found matching your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
