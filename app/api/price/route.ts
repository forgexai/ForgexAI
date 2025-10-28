import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { getSolanaConnection } from "@/lib/solana-config";
import { searchTokens } from "@/lib/token-resolver";

const MINT_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function fetchPriceV3(id: string) {
  // lite-api v3 — returns keyed by id with usdPrice
  const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${encodeURIComponent(id)}`);
  const data = await res.json();
  return { ok: res.ok, data };
}

// No symbol resolution: mint-only

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenIdParam = searchParams.get("tokenId") || searchParams.get("id");
    console.log("[PRICE] incoming params:", {
      raw: tokenIdParam,
    });
    if (!tokenIdParam) {
      return NextResponse.json({ error: "tokenId (mint address or symbol) is required" }, { status: 400 });
    }

    let tokenId = tokenIdParam.trim();
    let tokenSymbol = tokenId;
    
    // Handle known problematic mint addresses that ChatGPT might use
    const KNOWN_INVALID_MINTS = {
      '9Y2pM6yU9vYkDWZzWkRfJNVjzR4L5VECrjE1bixFqWjP': 'TRUMP'
    };
    
    if (KNOWN_INVALID_MINTS[tokenId as keyof typeof KNOWN_INVALID_MINTS]) {
      const correctedSymbol = KNOWN_INVALID_MINTS[tokenId as keyof typeof KNOWN_INVALID_MINTS];
      console.log(`[PRICE] Correcting known invalid mint ${tokenId} to symbol ${correctedSymbol}`);
      tokenId = correctedSymbol;
    }
    
    // If it's not a mint address, try to resolve it as a symbol
    if (!MINT_REGEX.test(tokenId)) {
      console.log("[PRICE] Resolving symbol to mint address:", tokenId);
      try {
        const tokens = await searchTokens(tokenId, 1);
        if (tokens.length === 0) {
          return NextResponse.json({ 
            error: `Token "${tokenId}" not found. Please provide a valid token symbol or mint address.` 
          }, { status: 404 });
        }
        tokenId = tokens[0].id; // Use the mint address
        tokenSymbol = tokens[0].symbol;
        console.log("[PRICE] Resolved", tokenSymbol, "to mint:", tokenId);
      } catch (error) {
        console.error("[PRICE] Token resolution failed:", error);
        return NextResponse.json({ 
          error: `Failed to resolve token "${tokenId}". Please provide a valid mint address.` 
        }, { status: 400 });
      }
    } else {
      // It's a mint address - check if it exists in Jupiter, if not try as symbol
      const { ok: testOk } = await fetchPriceV3(tokenId);
      if (!testOk) {
        console.log("[PRICE] Mint address not found in Jupiter, trying as symbol:", tokenId);
        // Try to find a token with this as a symbol instead
        try {
          const tokens = await searchTokens(tokenId, 1);
          if (tokens.length > 0) {
            tokenId = tokens[0].id;
            tokenSymbol = tokens[0].symbol;
            console.log("[PRICE] Found token by symbol search:", tokenSymbol, "->", tokenId);
          }
        } catch (error) {
          console.warn("[PRICE] Symbol fallback failed:", error);
        }
      }
    }

    // Fetch USD price via lite-api v3
    const { ok, data } = await fetchPriceV3(tokenId);
    console.log("[PRICE] jup lite v3 ok:", ok, "keys:", data ? Object.keys(data) : null);
    if (!ok) {
      throw new Error(data?.error || "Failed to fetch price");
    }

    // Support both data shapes: direct keyed, or nested "data"
    const node = data?.[tokenId] || data?.data?.[tokenId];
    const usdPrice = node?.usdPrice ?? node?.price;
    if (usdPrice == null) {
      console.warn("[PRICE] no price in response for", tokenId, "node:", node);
      return NextResponse.json({ error: "Price not available for the given token" }, { status: 404 });
    }

    // Market cap via mint supply
    const connection = getSolanaConnection();
    const mintInfo = await getMint(connection, new PublicKey(tokenId));
    const supply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
    const marketCap = supply * parseFloat(usdPrice);

    const formatPrice = (price: number) => {
      if (price < 0.0001) return price.toFixed(12);
      if (price < 0.01) return price.toFixed(8);
      if (price < 1) return price.toFixed(6);
      return price.toFixed(4);
    };

    return NextResponse.json({
      tokenId,
      symbol: tokenSymbol,
      price: parseFloat(usdPrice),
      priceFormatted: formatPrice(parseFloat(usdPrice)),
      marketCap,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch price" },
      { status: 500 }
    );
  }
}


