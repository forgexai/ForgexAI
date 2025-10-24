"use client";

import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthLoader } from "./AuthLoader";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { ready, authenticated, forgexAuth } = usePrivyAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (forgexAuth.isLoading) {
    return <AuthLoader />;
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02021A]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
