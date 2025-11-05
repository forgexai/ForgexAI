"use client";

import { useEffect, useState } from "react";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { defaultApiClient } from "@/lib/api-utils";

export default function DebugAuthPage() {
  const { ready, authenticated, user, forgexAuth } = usePrivyAuth();
  const [localStorageState, setLocalStorageState] = useState<any>({});
  const [apiClientState, setApiClientState] = useState<any>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageState({
        authToken: localStorage.getItem("authToken")?.substring(0, 20) + "...",
        authTokenType: localStorage.getItem("authTokenType"),
        authTokenExpiry: localStorage.getItem("authTokenExpiry"),
      });

      setApiClientState({
        hasToken: !!defaultApiClient.getConfig().authToken,
        token: defaultApiClient.getConfig().authToken?.substring(0, 20) + "...",
      });
    }
  }, [forgexAuth]);

  const handleClearAuth = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

        <div className="space-y-6">
          {/* Privy State */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Privy State</h2>
            <div className="space-y-2">
              <p>
                <span className="text-gray-400">Ready:</span> {String(ready)}
              </p>
              <p>
                <span className="text-gray-400">Authenticated:</span>{" "}
                {String(authenticated)}
              </p>
              <p>
                <span className="text-gray-400">User ID:</span>{" "}
                {user?.id || "null"}
              </p>
              <p>
                <span className="text-gray-400">Email:</span>{" "}
                {user?.email?.address || user?.google?.email || "null"}
              </p>
            </div>
          </div>

          {/* ForgexAuth State */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">ForgexAuth State</h2>
            <div className="space-y-2">
              <p>
                <span className="text-gray-400">Is Authenticated:</span>{" "}
                {String(forgexAuth.isAuthenticated)}
              </p>
              <p>
                <span className="text-gray-400">Is Loading:</span>{" "}
                {String(forgexAuth.isLoading)}
              </p>
              <p>
                <span className="text-gray-400">User ID:</span>{" "}
                {forgexAuth.user?.userId || "null"}
              </p>
              <p>
                <span className="text-gray-400">Session Token:</span>{" "}
                {forgexAuth.sessionToken?.substring(0, 20) + "..." || "null"}
              </p>
              <p>
                <span className="text-gray-400">Error:</span>{" "}
                {forgexAuth.error || "null"}
              </p>
            </div>
          </div>

          {/* localStorage State */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">localStorage State</h2>
            <div className="space-y-2">
              <p>
                <span className="text-gray-400">Auth Token:</span>{" "}
                {localStorageState.authToken || "null"}
              </p>
              <p>
                <span className="text-gray-400">Token Type:</span>{" "}
                {localStorageState.authTokenType || "null"}
              </p>
              <p>
                <span className="text-gray-400">Token Expiry:</span>{" "}
                {localStorageState.authTokenExpiry
                  ? new Date(
                      parseInt(localStorageState.authTokenExpiry)
                    ).toLocaleString()
                  : "null"}
              </p>
            </div>
          </div>

          {/* API Client State */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Client State</h2>
            <div className="space-y-2">
              <p>
                <span className="text-gray-400">Has Token:</span>{" "}
                {String(apiClientState.hasToken)}
              </p>
              <p>
                <span className="text-gray-400">Token:</span>{" "}
                {apiClientState.token || "null"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <button
                onClick={handleClearAuth}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Clear All Auth State
              </button>
              <button
                onClick={() => (window.location.href = "/?clearAuth=true")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Clear via URL Param
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
