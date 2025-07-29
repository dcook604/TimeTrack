import { TempoInit } from "@/components/tempo-init";
import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Timetracker - Employee Time Management",
  description: "A comprehensive time tracking and vacation management system for Canadian businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Only load Tempo devtools in development */}
      {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEMPO && (
        <Script 
          src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js"
          strategy="lazyOnload"
        />
      )}
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <TempoInit />
      </body>
    </html>
  );
}
