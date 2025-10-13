"use client";

import { usePrivyAuth } from "@/hooks/usePrivyAuth";

export function AuthDebug() {
  const { 
    ready, 
    authenticated, 
    user, 
    wallets, 
    forgexAuth,
    authenticateWithForgex,
    logoutFromForgex 
  } = usePrivyAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Ready: {ready ? "✅" : "❌"}</div>
        <div>Privy Auth: {authenticated ? "✅" : "❌"}</div>
        <div>Forgex Auth: {forgexAuth.isAuthenticated ? "✅" : "❌"}</div>
        <div>Wallets: {wallets?.length || 0}</div>
        <div>User: {user?.id ? "✅" : "❌"}</div>
        {forgexAuth.error && (
          <div className="text-red-400">Error: {forgexAuth.error}</div>
        )}
        {forgexAuth.isLoading && (
          <div className="text-yellow-400">Loading...</div>
        )}
      </div>
      <div className="mt-2 space-x-2">
        <button 
          onClick={authenticateWithForgex}
          className="bg-blue-500 px-2 py-1 rounded text-xs"
        >
          Force Auth
        </button>
        <button 
          onClick={logoutFromForgex}
          className="bg-red-500 px-2 py-1 rounded text-xs"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
