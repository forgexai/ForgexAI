import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientProvider from "@/lib/providers/ClientProvider";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { GlobalAuthLoader } from "@/components/auth/GlobalAuthLoader";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/suppress-privy-warnings";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ForgeX AI",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <ClientProvider>
          <AuthInitializer />
          <GlobalAuthLoader />
          {children}
          <Toaster />
        </ClientProvider>
      </body>
    </html>
  );
}
