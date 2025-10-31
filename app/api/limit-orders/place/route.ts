import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { inputToken, outputToken, amount, price, orderType } = await request.json();

    if (!inputToken || !outputToken || !amount || !price || !orderType) {
      return NextResponse.json(
        { success: false, error: 'All order parameters are required' },
        { status: 400 }
      );
    }

    // Mock limit order placement - replace with actual Jupiter limit order API
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderData = {
      orderId,
      inputToken,
      outputToken,
      amount: parseFloat(amount),
      price: parseFloat(price),
      orderType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedFill: orderType === 'buy' ? 
        `${(parseFloat(amount) / parseFloat(price)).toFixed(6)} ${outputToken}` :
        `${(parseFloat(amount) * parseFloat(price)).toFixed(6)} ${outputToken}`,
      fees: {
        platform: 0.0025, // 0.25%
        network: 0.000005 // 5 lamports
      }
    };

    return NextResponse.json({
      success: true,
      ...orderData,
      message: 'Limit order placed successfully'
    });

  } catch (error: any) {
    console.error('Place limit order API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to place limit order',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
