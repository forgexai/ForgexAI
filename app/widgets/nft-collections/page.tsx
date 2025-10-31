'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface NFTCollection {
  name: string;
  symbol: string;
  floorPrice: number;
  volume24h: number;
  marketCap: number;
  verified: boolean;
}

export default function NFTCollectionsWidget() {
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('floor_price');
  const [limit, setLimit] = useState(20);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockCollections: NFTCollection[] = [
        {
          name: 'Mad Lads',
          symbol: 'MADLADS',
          floorPrice: 45.2,
          volume24h: 1250.5,
          marketCap: 452000,
          verified: true
        },
        {
          name: 'Okay Bears',
          symbol: 'OKAYBEARS',
          floorPrice: 12.8,
          volume24h: 890.3,
          marketCap: 128000,
          verified: true
        },
        {
          name: 'DeGods',
          symbol: 'DEGODS',
          floorPrice: 89.5,
          volume24h: 2150.8,
          marketCap: 895000,
          verified: true
        }
      ];
      
      setCollections(mockCollections.slice(0, limit));
    } catch (error) {
      console.error('Failed to fetch NFT collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [sortBy, limit]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">NFT Collections</h1>
        <p className="text-muted-foreground">
          Discover and analyze Solana NFT collections by floor price, volume, and market metrics
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search collections..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floor_price">Floor Price</SelectItem>
                <SelectItem value="volume_24h">24h Volume</SelectItem>
                <SelectItem value="market_cap">Market Cap</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchCollections} disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Search Collections'}
          </Button>
        </CardContent>
      </Card>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{collection.name}</CardTitle>
                {collection.verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    ✓ Verified
                  </Badge>
                )}
              </div>
              <CardDescription>{collection.symbol}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Floor Price
                  </div>
                  <div className="text-xl font-bold">{collection.floorPrice} SOL</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    24h Volume
                  </div>
                  <div className="text-xl font-bold">{collection.volume24h} SOL</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Market Cap
                </div>
                <div className="text-lg font-semibold">${collection.marketCap.toLocaleString()}</div>
              </div>
              <Button variant="outline" className="w-full">
                View Collection
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {collections.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No collections found. Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
