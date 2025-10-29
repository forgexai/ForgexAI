import { TOKENS, TOKEN_DECIMALS, JUPITER_API } from "@/lib/solana-config";

export type ResolvedToken = {
  mint: string;
  symbol: string;
  decimals: number;
  name?: string;
  icon?: string;
  isVerified?: boolean;
  tags?: string[];
  usdPrice?: number;
  mcap?: number;
  liquidity?: number;
};

export type JupiterTokenInfo = {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  twitter?: string;
  telegram?: string;
  website?: string;
  dev?: string;
  circSupply?: number;
  totalSupply?: number;
  tokenProgram: string;
  launchpad?: string;
  partnerConfig?: string;
  graduatedPool?: string;
  graduatedAt?: string;
  holderCount?: number;
  fdv?: number;
  mcap?: number;
  usdPrice?: number;
  priceBlockId?: number;
  liquidity?: number;
  organicScore: number;
  organicScoreLabel: 'high' | 'medium' | 'low';
  isVerified?: boolean;
  cexes?: string[];
  tags?: string[];
  updatedAt: string;
};

function isMintAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function sanitizeSymbol(input: string): string {
  return input.trim().replace(/^\$/i, "").toUpperCase();
}

/**
 * Search for tokens using Jupiter's comprehensive search API
 * Supports symbol, name, or mint address search
 * Also enriches with RugCheck security data when available
 */
export async function searchTokens(query: string, limit: number = 20): Promise<JupiterTokenInfo[]> {
  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(`${JUPITER_API.TOKEN_SEARCH}?query=${encodedQuery}`);
    
    if (!response.ok) {
      console.warn(`Jupiter token search failed: ${response.status}`);
      return [];
    }
    
    const tokens: JupiterTokenInfo[] = await response.json();
    
    if (!Array.isArray(tokens)) {
      console.warn('Invalid response format from Jupiter token search');
      return [];
    }

    // Enrich tokens with security data from RugCheck (for top results)
    const enrichedTokens = await Promise.all(
      tokens.slice(0, Math.min(5, tokens.length)).map(async (token) => {
        try {
          const securityResponse = await fetch(`/api/security/analyze?mint=${token.id}`);
          if (securityResponse.ok) {
            const securityData = await securityResponse.json();
            return {
              ...token,
              securityScore: securityData.riskScoreNormalized,
              isRugged: securityData.isRugged,
              riskLevel: securityData.riskScoreNormalized > 70 ? 'high' : 
                        securityData.riskScoreNormalized > 40 ? 'medium' : 'low'
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch security data for ${token.symbol}:`, error);
        }
        return token;
      })
    );

    // Add remaining tokens without security data
    const remainingTokens = tokens.slice(Math.min(5, tokens.length));
    const allTokens = [...enrichedTokens, ...remainingTokens];
    
    // Sort by relevance: verified > high organic score > liquidity > market cap
    const sortedTokens = tokens.sort((a, b) => {
      // Prioritize verified tokens
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      
      // Then by organic score
      const scoreWeight = { high: 3, medium: 2, low: 1 };
      const aScore = scoreWeight[a.organicScoreLabel] || 0;
      const bScore = scoreWeight[b.organicScoreLabel] || 0;
      if (aScore !== bScore) return bScore - aScore;
      
      // Then by liquidity
      const aLiq = a.liquidity || 0;
      const bLiq = b.liquidity || 0;
      if (aLiq !== bLiq) return bLiq - aLiq;
      
      // Finally by market cap
      const aMcap = a.mcap || 0;
      const bMcap = b.mcap || 0;
      return bMcap - aMcap;
    });
    
    return sortedTokens.slice(0, limit);
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}

/**
 * Get token information by mint address
 */
export async function getTokenByMint(mintAddress: string): Promise<JupiterTokenInfo | null> {
  try {
    const tokens = await searchTokens(mintAddress, 1);
    return tokens.length > 0 ? tokens[0] : null;
  } catch (error) {
    console.error('Error fetching token by mint:', error);
    return null;
  }
}

/**
 * Legacy function for backward compatibility
 */
async function searchLiteBySymbol(symbol: string): Promise<{ address: string; symbol: string; decimals: number } | null> {
  try {
    const tokens = await searchTokens(symbol, 1);
    if (tokens.length === 0) return null;
    
    const token = tokens[0];
    return {
      address: token.id,
      symbol: token.symbol,
      decimals: token.decimals
    };
  } catch {
    return null;
  }
}

/**
 * Enhanced token resolver with comprehensive Jupiter search
 */
export async function resolveTokenParam(
  input: string | null | undefined,
  fallbackSymbol: keyof typeof TOKENS
): Promise<ResolvedToken> {
  // Fallbacks
  const fallbackMint = TOKENS[fallbackSymbol];
  const fallbackDecimals = TOKEN_DECIMALS[fallbackSymbol] ?? 9;

  if (!input || input.trim() === "") {
    return { 
      mint: fallbackMint, 
      symbol: String(fallbackSymbol), 
      decimals: fallbackDecimals 
    };
  }

  const raw = input.trim();
  
  // Handle mint address input
  if (isMintAddress(raw)) {
    const tokenInfo = await getTokenByMint(raw);
    if (tokenInfo) {
      return {
        mint: tokenInfo.id,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        name: tokenInfo.name,
        icon: tokenInfo.icon,
        isVerified: tokenInfo.isVerified,
        tags: tokenInfo.tags,
        usdPrice: tokenInfo.usdPrice,
        mcap: tokenInfo.mcap,
        liquidity: tokenInfo.liquidity
      };
    }
    // Fallback for mint addresses not found in Jupiter
    return { mint: raw, symbol: raw, decimals: 9 };
  }

  // Handle symbol/name search
  const sym = sanitizeSymbol(raw);

  // Quick path for known tokens
  if ((TOKENS as any)[sym]) {
    const mint = (TOKENS as any)[sym] as string;
    const decimals = (TOKEN_DECIMALS as any)[sym] ?? 9;
    return { mint, symbol: sym, decimals };
  }

  // Search using Jupiter's comprehensive API
  const searchResults = await searchTokens(raw, 1);
  if (searchResults.length > 0) {
    const token = searchResults[0];
    return {
      mint: token.id,
      symbol: token.symbol,
      decimals: token.decimals,
      name: token.name,
      icon: token.icon,
      isVerified: token.isVerified,
      tags: token.tags,
      usdPrice: token.usdPrice,
      mcap: token.mcap,
      liquidity: token.liquidity
    };
  }

  // Fallback to original token
  return { 
    mint: fallbackMint, 
    symbol: String(fallbackSymbol), 
    decimals: fallbackDecimals 
  };
}

/**
 * Get multiple token suggestions for autocomplete
 */
export async function getTokenSuggestions(query: string, limit: number = 10): Promise<ResolvedToken[]> {
  if (!query || query.trim().length < 2) {
    // Return popular tokens for empty/short queries
    return [
      { mint: TOKENS.SOL, symbol: 'SOL', decimals: 9 },
      { mint: TOKENS.USDC, symbol: 'USDC', decimals: 6 },
      { mint: TOKENS.USDT, symbol: 'USDT', decimals: 6 }
    ];
  }

  const searchResults = await searchTokens(query, limit);
  return searchResults.map(token => ({
    mint: token.id,
    symbol: token.symbol,
    decimals: token.decimals,
    name: token.name,
    icon: token.icon,
    isVerified: token.isVerified,
    tags: token.tags,
    usdPrice: token.usdPrice,
    mcap: token.mcap,
    liquidity: token.liquidity
  }));
}
