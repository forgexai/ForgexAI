import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const speed = searchParams.get('speed') || 'medium';
    const transactionType = searchParams.get('type') || '';

    // Mock priority fee estimation - replace with actual Solana RPC calls
    const priorityFeeMap = {
      slow: { microLamports: 1000, estimatedTime: '30-60 seconds' },
      medium: { microLamports: 5000, estimatedTime: '10-30 seconds' },
      fast: { microLamports: 10000, estimatedTime: '5-15 seconds' },
      turbo: { microLamports: 50000, estimatedTime: '1-5 seconds' }
    };

    const baseFee = priorityFeeMap[speed as keyof typeof priorityFeeMap] || priorityFeeMap.medium;
    
    // Adjust fee based on transaction type
    let adjustedFee = baseFee.microLamports;
    if (transactionType === 'swap') {
      adjustedFee *= 1.2; // Swaps need higher priority
    } else if (transactionType === 'nft') {
      adjustedFee *= 1.5; // NFT transactions are more competitive
    }

    const feeData = {
      speed,
      transactionType,
      microLamports: Math.round(adjustedFee),
      solAmount: adjustedFee / 1_000_000_000, // Convert to SOL
      estimatedTime: baseFee.estimatedTime,
      currentSlot: 280_000_000 + Math.floor(Math.random() * 1000), // Mock current slot
      networkCongestion: 'medium',
      recommendations: {
        slow: 'Use for non-urgent transactions',
        medium: 'Recommended for most transactions',
        fast: 'Use during high network activity',
        turbo: 'Use for time-critical transactions'
      }
    };

    return NextResponse.json({
      success: true,
      ...feeData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Priority fee estimation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to estimate priority fee',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
