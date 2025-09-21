"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/warehouses", label: "Warehouses" },
  { href: "/units", label: "Units" },
];

const reportLinks = [
  { href: "/reports/low-stock", label: "Low Stock" },
  { href: "/reports/movements", label: "Movements" },
];

export function MainNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Becca Perfumes</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 grid gap-1">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className={cn("rounded px-2 py-2 text-sm hover:bg-muted", isActive(l.href) && "bg-muted font-medium")}>{l.label}</Link>
                ))}
                <div className="mt-2 text-xs font-semibold uppercase text-muted-foreground">Reports</div>
                {reportLinks.map((l) => (
                  <Link key={l.href} href={l.href} className={cn("rounded px-2 py-2 text-sm hover:bg-muted", isActive(l.href) && "bg-muted font-medium")}>{l.label}</Link>
                ))}
              </nav>
              <div className="mt-5 grid gap-2">
                <Button asChild>
                  <Link href="/products/new" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Product
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/warehouses" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Warehouse
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="font-semibold">Becca Perfumes</Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
                  isActive(l.href) && "bg-muted text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Reports</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {reportLinks.map((l) => (
                  <DropdownMenuItem key={l.href} asChild>
                    <Link href={l.href}>{l.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/products/new" className="gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/warehouses" className="gap-2">
                <Plus className="h-4 w-4" /> Add Warehouse
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}