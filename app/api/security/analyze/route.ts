import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mint = searchParams.get("mint");

    if (!mint) {
      return NextResponse.json(
        { error: "Token mint address is required" },
        { status: 400 }
      );
    }

    // Call RugCheck API
    const rugCheckResponse = await fetch(
      `https://api.rugcheck.xyz/v1/tokens/${mint}/report`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ForgeX-AI/1.0',
        },
      }
    );

    if (!rugCheckResponse.ok) {
      return NextResponse.json(
        { error: `RugCheck API error: ${rugCheckResponse.status}` },
        { status: rugCheckResponse.status }
      );
    }

    const rugData = await rugCheckResponse.json();

    // Process and format the response
    const analysis = {
      mint: rugData.mint,
      tokenInfo: {
        name: rugData.tokenMeta?.name || rugData.fileMeta?.name || "Unknown",
        symbol: rugData.tokenMeta?.symbol || rugData.fileMeta?.symbol || "Unknown",
        decimals: rugData.token?.decimals || 0,
        supply: rugData.token?.supply || 0,
        image: rugData.fileMeta?.image || rugData.tokenMeta?.uri,
      },
      
      // Risk Assessment
      riskScore: rugData.score || 0,
      riskScoreNormalized: rugData.score_normalised || 0,
      isRugged: rugData.rugged || false,
      
      // Authority Analysis
      mintAuthority: rugData.token?.mintAuthority,
      freezeAuthority: rugData.token?.freezeAuthority,
      
      // Market Data
      price: rugData.price || 0,
      marketCap: rugData.fileMeta?.marketCap || 0,
      liquidity: rugData.totalMarketLiquidity || 0,
      totalHolders: rugData.totalHolders || 0,
      lpProviders: rugData.totalLPProviders || 0,
      
      // Risk Factors
      risks: rugData.risks?.map((risk: any) => ({
        name: risk.name,
        description: risk.description,
        score: risk.score,
        level: risk.level,
        value: risk.value,
      })) || [],
      
      // Top Holders Analysis
      topHolders: rugData.topHolders?.slice(0, 5).map((holder: any) => ({
        address: holder.address,
        percentage: holder.pct,
        amount: holder.uiAmount,
        isInsider: holder.insider,
      })) || [],
      
      // Insider Networks
      insiderNetworks: rugData.insiderNetworks?.map((network: any) => ({
        id: network.id,
        size: network.size,
        type: network.type,
        tokenAmount: network.tokenAmount,
        activeAccounts: network.activeAccounts,
      })) || [],
      
      // Verification Status
      verification: rugData.verification ? {
        jupiterVerified: rugData.verification.jup_verified || false,
        jupiterStrict: rugData.verification.jup_strict || false,
        links: rugData.verification.links || [],
      } : null,
      
      // Market Information
      markets: rugData.markets?.map((market: any) => ({
        pubkey: market.pubkey,
        type: market.marketType,
        liquidity: market.lp?.lpLockedUSD || 0,
      })) || [],
      
      // Transfer Fee
      transferFee: rugData.transferFee ? {
        percentage: rugData.transferFee.pct || 0,
        maxAmount: rugData.transferFee.maxAmount || 0,
      } : null,
      
      // Summary
      summary: generateRiskSummary(rugData),
      
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Security analysis error:", error);
    return NextResponse.json(
      { error: `Failed to analyze token security: ${error.message}` },
      { status: 500 }
    );
  }
}

function generateRiskSummary(rugData: any): string {
  const score = rugData.score_normalised || 0;
  const risks = rugData.risks || [];
  const isRugged = rugData.rugged;
  
  if (isRugged) {
    return "⚠️ RUGGED TOKEN - This token has been identified as a rug pull. Do not trade.";
  }
  
  if (score >= 80) {
    return "🚨 EXTREME RISK - Multiple critical risk factors detected. Avoid trading this token.";
  } else if (score >= 60) {
    return "⚠️ HIGH RISK - Several risk factors present. Exercise extreme caution.";
  } else if (score >= 40) {
    return "⚡ MEDIUM RISK - Some risk factors detected. Trade with caution and do your research.";
  } else if (score >= 20) {
    return "⚠️ LOW-MEDIUM RISK - Minor risk factors present. Generally safer but still verify.";
  } else if (score > 0) {
    return "✅ LOW RISK - Minimal risk factors detected. Appears to be a legitimate token.";
  } else {
    return "✅ VERY LOW RISK - No significant risk factors detected. Token appears safe.";
  }
}
