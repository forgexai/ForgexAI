"use client";

import { useState, useEffect } from "react";
import { defaultApiClient, type MarketplaceListing } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Star, 
  Eye, 
  ShoppingCart, 
  Download, 
  Zap, 
  Users, 
  Clock,
  Tag
} from "lucide-react";

interface MarketplaceSectionProps {}

export function MarketplaceSection({}: MarketplaceSectionProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "recent" | "price-low" | "price-high">("popular");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    loadMarketplaceListings();
  }, [sortBy, category]);

  const loadMarketplaceListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      refreshApiClientAuth();
      
      const response = await defaultApiClient.getMarketplaceListings({
        sort: sortBy,
        category: category || undefined,
        limit: 20,
        offset: 0,
      });

      if (response.success && response.data) {
        setListings(response.data.listings);
      } else {
        setError(response.error || "Failed to load marketplace listings");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading listings");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (pricing: MarketplaceListing["pricing"]) => {
    if (pricing.type === "free") return "Free";
    if (pricing.type === "credits") return `${pricing.amount} Credits`;
    if (pricing.type === "sol") return `${pricing.amount} SOL`;
    return `${pricing.amount}`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      defi: "💰",
      nft: "🖼️",
      dao: "🏛️",
      trading: "📈",
      analytics: "📊",
      automation: "🤖",
      monitoring: "👁️",
      general: "⚙️",
    };
    return icons[category] || "⚙️";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Marketplace</h2>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Marketplace</h2>
        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={loadMarketplaceListings} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Marketplace</h2>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Most Recent</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All Categories</option>
            <option value="defi">DeFi</option>
            <option value="nft">NFT</option>
            <option value="dao">DAO</option>
            <option value="trading">Trading</option>
            <option value="analytics">Analytics</option>
            <option value="automation">Automation</option>
            <option value="monitoring">Monitoring</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <div className="mb-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-500"
            >
              <rect
                x="10"
                y="15"
                width="60"
                height="50"
                rx="6"
                fill="currentColor"
                fillOpacity="0.1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="20"
                y="25"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <rect
                x="45"
                y="25"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <rect
                x="20"
                y="45"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <rect
                x="45"
                y="45"
                width="15"
                height="12"
                rx="2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <circle
                cx="27.5"
                cy="31"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <circle
                cx="52.5"
                cy="31"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <circle
                cx="27.5"
                cy="51"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
              <circle
                cx="52.5"
                cy="51"
                r="2"
                fill="currentColor"
                fillOpacity="0.4"
              />
            </svg>
          </div>
          <p className="text-center mb-6 text-gray-300">No workflows found in the marketplace</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{listing.name}</CardTitle>
                    <CardDescription className="mt-1">
                      by {listing.sellerName || "Anonymous"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-2xl">{getCategoryIcon(listing.category)}</span>
                    {listing.featured && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {listing.description}
                </p>

                {listing.thumbnail && (
                  <div className="mb-4 rounded-md overflow-hidden bg-muted">
                    <img
                      src={listing.thumbnail}
                      alt={listing.name}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {listing.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {listing.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{listing.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{listing.stats.rating.toFixed(1)}</span>
                        <span>({listing.stats.ratingCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{listing.stats.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{listing.stats.purchases}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>{listing.preview.nodes} nodes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{listing.preview.protocols.length} protocols</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-lg font-semibold">
                      {formatPrice(listing.pricing)}
                    </div>
                    <Button size="sm" className="gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Purchase
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
