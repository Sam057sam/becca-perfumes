"use client";

import * as React from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

interface AppProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AppProviders({ children, session }: AppProvidersProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      {mounted ? (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      ) : (
        children
      )}
    </SessionProvider>
  );
}
