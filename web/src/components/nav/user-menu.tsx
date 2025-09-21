"use client";

import { useSession, signOut } from "next-auth/react";
import { CircleUser } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CircleUser className="h-4 w-4" />
          <span className="hidden sm:inline">{user?.name ?? user?.email ?? "Account"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          Signed in as
          <div className="truncate text-xs text-muted-foreground">{user?.email ?? "unknown"}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/sign-in" })}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}