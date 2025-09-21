import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { authOptions } from "@/lib/auth/options";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Becca Perfumes Console",
  description: "Inventory, sales, and expense management platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
