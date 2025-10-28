import { NextResponse } from "next/server";
import { searchTokens, getTokenSuggestions } from "@/lib/token-resolver";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // If no query or very short query, return suggestions
    if (!query || query.trim().length < 2) {
      const suggestions = await getTokenSuggestions("", limit);
      return NextResponse.json({
        success: true,
        tokens: suggestions,
        query: query.trim(),
        count: suggestions.length,
        type: "suggestions"
      });
    }

    // Search for tokens using Jupiter API
    const tokens = await searchTokens(query.trim(), limit);
    
    return NextResponse.json({
      success: true,
      tokens: tokens.map(token => ({
        mint: token.id,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        icon: token.icon,
        isVerified: token.isVerified,
        tags: token.tags,
        usdPrice: token.usdPrice,
        mcap: token.mcap,
        liquidity: token.liquidity,
        organicScore: token.organicScore,
        organicScoreLabel: token.organicScoreLabel,
        holderCount: token.holderCount,
        fdv: token.fdv
      })),
      query: query.trim(),
      count: tokens.length,
      type: "search"
    });
  } catch (error) {
    console.error("Error in token search API:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to search tokens",
        tokens: [],
        query: "",
        count: 0
      },
      { status: 500 }
    );
  }
}
