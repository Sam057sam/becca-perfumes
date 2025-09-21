import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function createAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim() || undefined;
  if (!name) return;

  await prisma.warehouse.create({ data: { name, code, isActive: true } });
}

async function getData() {
  const items = await prisma.warehouse.findMany({ orderBy: { name: "asc" } });
  return items;
}

export default async function WarehousesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const items = await getData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Warehouses</h1>
          <p className="text-sm text-muted-foreground">Locations where stock is held.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/api/export/warehouses">Export CSV</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Warehouse</CardTitle>
          <CardDescription>Create a new warehouse/location.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Main Warehouse" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" placeholder="e.g. MAIN" />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Warehouses</CardTitle>
          <CardDescription>Active and inactive warehouses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>{w.code ?? "-"}</TableCell>
                  <TableCell>{w.isActive ? "Active" : "Disabled"}</TableCell>
                  <TableCell className="text-right">
                    <form action={async () => {
                      "use server";
                      try {
                        await prisma.warehouse.delete({ where: { id: w.id } });
                      } catch (e) {
                        // ignore
                      }
                    }}>
                      <Button type="submit" variant="destructive" size="sm">Delete</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
