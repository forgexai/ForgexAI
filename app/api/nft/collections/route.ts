import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const sortBy = searchParams.get('sortBy') || 'floor_price';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock NFT collections data - replace with actual Helius/Magic Eden API calls
    const mockCollections = [
      {
        name: 'Mad Lads',
        symbol: 'MADLADS',
        floorPrice: 45.2,
        volume24h: 1250.5,
        marketCap: 452000,
        verified: true,
        image: 'https://creator-hub-prod.s3.us-east-2.amazonaws.com/mad_lads_pfp_1679977427214.png'
      },
      {
        name: 'Okay Bears',
        symbol: 'OKAYBEARS',
        floorPrice: 12.8,
        volume24h: 890.3,
        marketCap: 128000,
        verified: true,
        image: 'https://bafybeihvvulpp4evqzk7zq6xxvzd3y2tjlzgkqkjnm6jgqyqz5qz5qz5qz.ipfs.nftstorage.link/'
      },
      {
        name: 'DeGods',
        symbol: 'DEGODS',
        floorPrice: 89.5,
        volume24h: 2150.8,
        marketCap: 895000,
        verified: true,
        image: 'https://metadata.degods.com/g/1.png'
      },
      {
        name: 'y00ts',
        symbol: 'Y00TS',
        floorPrice: 25.3,
        volume24h: 1580.2,
        marketCap: 253000,
        verified: true,
        image: 'https://metadata.y00ts.com/y/1.png'
      },
      {
        name: 'Solana Monkey Business',
        symbol: 'SMB',
        floorPrice: 18.7,
        volume24h: 945.6,
        marketCap: 187000,
        verified: true,
        image: 'https://arweave.net/26YdhY_eAzv26YdhY_eAzv26YdhY_eAzv26YdhY_eAzv'
      }
    ];

    // Filter by query if provided
    let filteredCollections = mockCollections;
    if (query) {
      filteredCollections = mockCollections.filter(collection =>
        collection.name.toLowerCase().includes(query.toLowerCase()) ||
        collection.symbol.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort collections
    filteredCollections.sort((a, b) => {
      switch (sortBy) {
        case 'volume_24h':
          return b.volume24h - a.volume24h;
        case 'market_cap':
          return b.marketCap - a.marketCap;
        case 'floor_price':
        default:
          return b.floorPrice - a.floorPrice;
      }
    });

    // Limit results
    const limitedCollections = filteredCollections.slice(0, limit);

    return NextResponse.json({
      success: true,
      collections: limitedCollections,
      query,
      sortBy,
      limit,
      total: filteredCollections.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('NFT collections API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch NFT collections',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
