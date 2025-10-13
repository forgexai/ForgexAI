"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export function PrivyLoginCard() {
  const { ready, authenticated, user, login, logout, wallets } = usePrivyAuth();

  if (!ready) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!authenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to ForgeX AI</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={login} className="w-full">
            Login with Google or Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p className="text-sm">{user?.email || "N/A"}</p>
        </div>
        
        {wallets.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Connected Wallets</p>
            <div className="space-y-2">
              {wallets.map((wallet, index) => (
                <div key={wallet.address} className="text-xs font-mono bg-muted p-2 rounded">
                  {wallet.address}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button onClick={logout} variant="outline" className="w-full">
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}
