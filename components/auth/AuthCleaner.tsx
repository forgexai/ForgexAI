"use client";

import { useEffect } from "react";

/**
 * This component clears auth state when needed
 * Add ?clearAuth=true to any URL to force clear auth
 */
export function AuthCleaner() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldClearAuth = urlParams.get("clearAuth");

    if (shouldClearAuth === "true") {
      console.log("🧹 Clearing all auth state...");

      // Clear all auth-related localStorage items
      localStorage.removeItem("authToken");
      localStorage.removeItem("authTokenType");
      localStorage.removeItem("authTokenExpiry");
      localStorage.removeItem("privy:token");
      localStorage.removeItem("privy:refresh_token");

      console.log("✅ Auth state cleared. Reloading...");

      // Remove the clearAuth param and reload
      const url = new URL(window.location.href);
      url.searchParams.delete("clearAuth");
      window.location.href = url.toString();
    }
  }, []);

  return null;
}
