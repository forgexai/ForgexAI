import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const includeNFTs = searchParams.get('includeNFTs') !== 'false';

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Mock portfolio value calculation - replace with actual SDK calls
    // This would integrate with Birdeye, Helius, and other services
    const mockPortfolioData = {
      sol: 2.5847, // SOL balance
      tokens: 1250.75, // Value of SPL tokens
      nfts: includeNFTs ? 890.50 : 0, // NFT floor value
      defi: 2340.25, // DeFi positions (Raydium, Marinade, etc.)
      breakdown: {
        solValue: 2.5847 * 180, // Mock SOL price
        tokenBreakdown: [
          { symbol: 'USDC', balance: 1000.50, value: 1000.50 },
          { symbol: 'BONK', balance: 1000000, value: 15.00 },
          { symbol: 'RAY', balance: 150.25, value: 235.25 }
        ],
        nftBreakdown: includeNFTs ? [
          { collection: 'Mad Lads', count: 2, floorValue: 90.4 },
          { collection: 'Okay Bears', count: 1, floorValue: 12.8 },
          { collection: 'DeGods', count: 9, floorValue: 787.3 }
        ] : [],
        defiBreakdown: [
          { protocol: 'Raydium', type: 'LP', value: 1200.50 },
          { protocol: 'Marinade', type: 'Staking', value: 890.00 },
          { protocol: 'Kamino', type: 'Lending', value: 249.75 }
        ]
      }
    };

    // Calculate total
    const total = mockPortfolioData.sol * 180 + 
                 mockPortfolioData.tokens + 
                 mockPortfolioData.nfts + 
                 mockPortfolioData.defi;

    const response = {
      ...mockPortfolioData,
      total,
      address,
      includeNFTs,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      ...response
    });

  } catch (error: any) {
    console.error('Portfolio value API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch portfolio value',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
