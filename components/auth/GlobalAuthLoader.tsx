"use client";

import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { AuthLoader } from "./AuthLoader";

export function GlobalAuthLoader() {
  const { forgexAuth } = usePrivyAuth();

  if (forgexAuth.isLoading) {
    return <AuthLoader />;
  }

  return null;
}
