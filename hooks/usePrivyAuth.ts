"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { defaultApiClient } from "@/lib/api-utils";
import { forgexAuthAtom, hasAttemptedAuthAtom } from "@/lib/state/atoms";

let lastSIWSData: {
  message: string;
  signature: string;
  timestamp: number;
} | null = null;

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;

    if (
      typeof url === "string" &&
      url.includes("auth.privy.io/api/v1/siws/authenticate")
    ) {
      try {
        const body = options?.body ? JSON.parse(options.body as string) : null;

        if (body?.message && body?.signature) {
          lastSIWSData = {
            message: body.message,
            signature: body.signature,
            timestamp: Date.now(),
          };
        }
      } catch (e) {
        console.error("[SIWS Interceptor] Failed to parse body:", e);
      }
    }

    return originalFetch(...args);
  };
}

export function usePrivyAuth() {
  const isAuthenticatingRef = useRef(false);
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkWallet,
    unlinkWallet,
    createWallet,
    exportWallet,
    getAccessToken,
  } = usePrivy();

  const { wallets } = useWallets();

  const [forgexAuth, setForgexAuth] = useAtom(forgexAuthAtom);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useAtom(hasAttemptedAuthAtom);

  const authenticateWithForgex = useCallback(async () => {
    if (!authenticated || hasAttemptedAuth || isAuthenticatingRef.current) {
      return;
    }

    isAuthenticatingRef.current = true;
    setHasAttemptedAuth(true);
    setForgexAuth((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log("🔐 Starting ForgexAI authentication...");

      // ALWAYS try Privy OAuth token first
      console.log("📱 Using Privy OAuth token authentication");
      const privyToken = await getAccessToken();

      if (privyToken) {
        console.log("✅ Got Privy token:", privyToken.substring(0, 20) + "...");
        // Use Privy token directly for backend authentication
        defaultApiClient.setAuthToken(privyToken);

        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", privyToken);
          localStorage.setItem("authTokenType", "privy");
          localStorage.setItem("authTokenExpiry", String(Date.now() + 3600000)); // 1 hour
        }

        setForgexAuth({
          isAuthenticated: true,
          sessionToken: privyToken,
          user: {
            userId: user?.id || "",
            walletAddress: user?.email?.address || user?.google?.email || "",
          },
          isLoading: false,
        });

        isAuthenticatingRef.current = false;
        console.log("✅ Authentication complete, redirecting to /workflows");
        router.push("/workflows");
        return;
      }

      // If Privy token fails, throw error
      throw new Error(
        "Failed to get Privy access token. Please try logging in again."
      );
    } catch (error: any) {
      console.error("❌ Authentication failed:", error);
      setForgexAuth({
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, [
    authenticated,
    hasAttemptedAuth,
    setForgexAuth,
    setHasAttemptedAuth,
    user,
    getAccessToken,
    router,
  ]);

  // Check for existing session token on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !hasAttemptedAuth) {
      const storedToken = localStorage.getItem("authToken");
      const tokenType = localStorage.getItem("authTokenType");
      const tokenExpiry = localStorage.getItem("authTokenExpiry");

      if (storedToken) {
        // Check if token is expired
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
          console.warn("⏰ Stored token expired, clearing...");
          localStorage.removeItem("authToken");
          localStorage.removeItem("authTokenType");
          localStorage.removeItem("authTokenExpiry");
          return;
        }

        console.log("✅ Found stored token, type:", tokenType);
        // Set the token in the API client
        defaultApiClient.setAuthToken(storedToken);

        // Set auth state as authenticated
        setForgexAuth((prev) => ({
          ...prev,
          isAuthenticated: true,
          sessionToken: storedToken,
          isLoading: false,
        }));
        setHasAttemptedAuth(true);
      }
    }
  }, [hasAttemptedAuth, setForgexAuth, setHasAttemptedAuth]);

  useEffect(() => {
    console.log("🔍 Auth Effect Triggered:", {
      ready,
      authenticated,
      hasAttemptedAuth,
      walletsCount: wallets?.length,
    });

    if (ready && authenticated && !hasAttemptedAuth) {
      console.log("🚀 Attempting to authenticate with ForgexAI...");
      if (wallets && wallets.length > 0) {
        authenticateWithForgex();
      } else {
        // Add a small delay to allow wallets to load
        const timeoutId = setTimeout(() => {
          if (!hasAttemptedAuth) {
            console.log(
              "⏰ Timeout reached, authenticating with or without wallets"
            );
            if (wallets && wallets.length > 0) {
              authenticateWithForgex();
            } else {
              authenticateWithForgex();
            }
          }
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [ready, authenticated, wallets, hasAttemptedAuth, authenticateWithForgex]);

  // Auto-refresh Privy token periodically
  useEffect(() => {
    if (!authenticated || !forgexAuth.isAuthenticated) return;

    const tokenType =
      typeof window !== "undefined"
        ? localStorage.getItem("authTokenType")
        : null;

    // Only refresh Privy tokens
    if (tokenType !== "privy") return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log("🔄 Refreshing Privy token...");
        const newToken = await getAccessToken();

        if (newToken) {
          console.log("✅ Token refreshed successfully");
          defaultApiClient.setAuthToken(newToken);

          if (typeof window !== "undefined") {
            localStorage.setItem("authToken", newToken);
            localStorage.setItem(
              "authTokenExpiry",
              String(Date.now() + 3600000)
            );
          }

          setForgexAuth((prev) => ({
            ...prev,
            sessionToken: newToken,
          }));
        }
      } catch (error) {
        console.error("❌ Failed to refresh token:", error);
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [
    authenticated,
    forgexAuth.isAuthenticated,
    getAccessToken,
    setForgexAuth,
  ]);

  const enhancedLogout = useCallback(async () => {
    try {
      await defaultApiClient.logout();
      defaultApiClient.clearAuth();

      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authTokenType");
        localStorage.removeItem("authTokenExpiry");
      }

      setForgexAuth({
        isAuthenticated: false,
        isLoading: false,
      });
      setHasAttemptedAuth(false);
      isAuthenticatingRef.current = false;

      lastSIWSData = null;

      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, setForgexAuth, setHasAttemptedAuth]);

  return {
    ready,
    authenticated,
    user,
    login,
    logout: enhancedLogout,
    linkWallet,
    unlinkWallet,
    createWallet,
    exportWallet,
    getAccessToken,
    wallets,
    forgexAuth,
  };
}
