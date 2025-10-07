"use client";

import { Toaster } from "@/components/ui/sonner";
import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

function ClientProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#8b5cf6", // ShadCN violet-500
        },
        loginMethods: ["google", "wallet"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          requireUserPasswordOnCreate: false,
          noPromptOnSignature: false,
        },
        embeddedWalletsConfig: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <Toaster />
      {children}
    </PrivyProvider>
  );
}

export default ClientProvider;
