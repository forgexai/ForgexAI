"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Check, Star, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TokenInfo {
  mint: string;
  symbol: string;
  name?: string;
  decimals: number;
  icon?: string;
  isVerified?: boolean;
  tags?: string[];
  usdPrice?: number;
  mcap?: number;
  liquidity?: number;
  organicScore?: number;
  organicScoreLabel?: "high" | "medium" | "low";
  holderCount?: number;
  fdv?: number;
}

interface TokenSearchProps {
  value: string;
  onChange: (token: TokenInfo) => void;
  placeholder?: string;
  className?: string;
}

export function TokenSearch({
  value,
  onChange,
  placeholder = "Search tokens...",
  className,
}: TokenSearchProps) {
  const [query, setQuery] = useState("");
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial suggestions
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Handle search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchTokens(query);
      } else {
        loadSuggestions();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tokens/search?limit=8");
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error("Error loading token suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchTokens = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/tokens/search?query=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error("Error searching tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSelect = (token: TokenInfo) => {
    onChange(token);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, tokens.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && tokens[selectedIndex]) {
          handleTokenSelect(tokens[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    if (price < 0.01) return `$${price.toExponential(2)}`;
    return `$${price.toFixed(price < 1 ? 4 : 2)}`;
  };

  const formatMarketCap = (mcap?: number) => {
    if (!mcap) return null;
    if (mcap >= 1e9) return `$${(mcap / 1e9).toFixed(1)}B`;
    if (mcap >= 1e6) return `$${(mcap / 1e6).toFixed(1)}M`;
    if (mcap >= 1e3) return `$${(mcap / 1e3).toFixed(1)}K`;
    return `$${mcap.toFixed(0)}`;
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto border-border/40">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching tokens...
              </div>
            ) : tokens.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No tokens found
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {tokens.map((token, index) => (
                  <button
                    key={token.mint}
                    onClick={() => handleTokenSelect(token)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                      selectedIndex === index && "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {token.icon ? (
                          <img
                            src={token.icon}
                            alt={token.symbol}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {token.symbol.slice(0, 2)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{token.symbol}</span>
                            {token.isVerified && (
                              <Check className="h-3 w-3 text-green-500" />
                            )}
                            {token.organicScoreLabel === "high" && (
                              <Star className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          {token.name && (
                            <div className="text-sm text-muted-foreground truncate">
                              {token.name}
                            </div>
                          )}
                          {token.tags && token.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {token.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs px-1 py-0"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm">
                        {token.usdPrice && (
                          <div className="flex items-center text-muted-foreground">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatPrice(token.usdPrice)}
                          </div>
                        )}
                        {token.mcap && (
                          <div className="flex items-center text-muted-foreground mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {formatMarketCap(token.mcap)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
