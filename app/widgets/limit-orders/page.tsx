'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface LimitOrder {
  orderId: string;
  inputToken: string;
  outputToken: string;
  amount: number;
  price: number;
  orderType: 'buy' | 'sell';
  status: 'pending' | 'partially_filled' | 'filled' | 'cancelled';
  createdAt: string;
  filled: number;
  remaining: number;
}

export default function LimitOrdersWidget() {
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('open');
  
  // New order form
  const [inputToken, setInputToken] = useState('SOL');
  const [outputToken, setOutputToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('sell');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockOrders: LimitOrder[] = [
        {
          orderId: 'order_1234567890_abc',
          inputToken: 'SOL',
          outputToken: 'USDC',
          amount: 1.0,
          price: 200.0,
          orderType: 'sell',
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          filled: 0,
          remaining: 1.0
        },
        {
          orderId: 'order_0987654321_def',
          inputToken: 'USDC',
          outputToken: 'BONK',
          amount: 1000.0,
          price: 0.000015,
          orderType: 'buy',
          status: 'partially_filled',
          createdAt: '2024-01-14T15:45:00Z',
          filled: 300.0,
          remaining: 700.0
        }
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const placeLimitOrder = async () => {
    if (!amount || !price) return;
    
    setLoading(true);
    try {
      // Mock order placement - replace with actual API call
      const newOrder: LimitOrder = {
        orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inputToken,
        outputToken,
        amount: parseFloat(amount),
        price: parseFloat(price),
        orderType,
        status: 'pending',
        createdAt: new Date().toISOString(),
        filled: 0,
        remaining: parseFloat(amount)
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setAmount('');
      setPrice('');
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.orderId === orderId 
        ? { ...order, status: 'cancelled' as const }
        : order
    ));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'partially_filled':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'filled':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partially_filled':
        return 'bg-blue-100 text-blue-800';
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openOrders = orders.filter(order => order.status === 'pending' || order.status === 'partially_filled');
  const orderHistory = orders.filter(order => order.status === 'filled' || order.status === 'cancelled');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Limit Orders</h1>
        <p className="text-muted-foreground">
          Place and manage limit orders on Jupiter aggregator
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="place">Place Order</TabsTrigger>
          <TabsTrigger value="open">Open Orders ({openOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="place">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Place Limit Order
              </CardTitle>
              <CardDescription>
                Set your desired price and amount for automatic execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Type</label>
                  <Select value={orderType} onValueChange={(value: 'buy' | 'sell') => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Buy
                        </div>
                      </SelectItem>
                      <SelectItem value="sell">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Sell
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Token</label>
                  <Select value={inputToken} onValueChange={setInputToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOL">SOL</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="BONK">BONK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Token</label>
                  <Select value={outputToken} onValueChange={setOutputToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="SOL">SOL</SelectItem>
                      <SelectItem value="BONK">BONK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Limit Price</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <Button 
                onClick={placeLimitOrder} 
                disabled={loading || !amount || !price}
                className="w-full"
              >
                {loading ? 'Placing Order...' : `Place ${orderType.toUpperCase()} Order`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open">
          <div className="space-y-4">
            {openOrders.map((order) => (
              <Card key={order.orderId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="font-semibold">
                          {order.orderType.toUpperCase()} {order.amount} {order.inputToken}
                        </span>
                        <span className="text-muted-foreground">
                          at {order.price} {order.outputToken}
                        </span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </div>
                      {order.status === 'partially_filled' && (
                        <div className="text-sm">
                          Filled: {order.filled} / {order.amount} ({((order.filled / order.amount) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => cancelOrder(order.orderId)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {openOrders.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No open orders</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {orderHistory.map((order) => (
              <Card key={order.orderId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="font-semibold">
                          {order.orderType.toUpperCase()} {order.amount} {order.inputToken}
                        </span>
                        <span className="text-muted-foreground">
                          at {order.price} {order.outputToken}
                        </span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {orderHistory.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No order history</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
