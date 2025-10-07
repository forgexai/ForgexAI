"use client";

import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";

function ClientProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster />
      {children}
    </>
  );
}

export default ClientProvider;
