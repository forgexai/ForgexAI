"use client";

import { useEffect } from "react";
import { initializeApiClient } from "@/lib/auth-utils";

export function AuthInitializer() {
  useEffect(() => {
    // Initialize API client with stored auth token on app startup
    initializeApiClient();
  }, []);

  return null; // This component doesn't render anything
}
