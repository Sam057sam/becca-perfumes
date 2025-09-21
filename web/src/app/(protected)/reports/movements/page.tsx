import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

type Search = {
  from?: string;
  to?: string;
  sku?: string;
  warehouseId?: string;
  type?: string;
};

function getRange(search: Search) {
  const now = new Date();
  const start = search.from ? new Date(search.from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endBase = search.to ? new Date(search.to) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate() + 1);
  return { start, end };
}

async function getData(search: Search) {
  const { start, end } = getRange(search);

  const where: any = { createdAt: { gte: start, lt: end } };
  if (search.type) where.type = search.type;
  if (search.warehouseId) where.warehouseId = Number(search.warehouseId);
  if (search.sku) {
    const needle = search.sku.trim();
    const products = await prisma.product.findMany({
      where: { OR: [{ sku: { contains: needle } }, { name: { contains: needle } }] },
      select: { id: true },
      take: 100,
    });
    where.productId = { in: products.map((p) => p.id) };
  }

  const [warehouses, rows] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      where,
      orderBy: { id: "desc" },
      take: 200,
      include: { product: { select: { sku: true, name: true } }, warehouse: true },
    }),
  ]);

  return { warehouses, rows };
}

export default async function MovementsReportPage({ searchParams }: { searchParams: Search }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const data = await getData(searchParams || {});
  const { warehouses, rows } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stock Movements</h1>
          <p className="text-sm text-muted-foreground">Adjustments, purchases, sales, and transfers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Date range, type, product, and warehouse.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-3 md:grid-cols-6">
            <div className="space-y-1">
              <Label htmlFor="from">From</Label>
              <Input id="from" name="from" type="date" defaultValue={searchParams.from} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="date" defaultValue={searchParams.to} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="sku">Product (SKU/Name)</Label>
              <Input id="sku" name="sku" placeholder="Search" defaultValue={searchParams.sku} />
            </div>
            <div className="space-y-1">
              <Label>Warehouse</Label>
              <Select name="warehouseId" defaultValue={searchParams.warehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select name="type" defaultValue={searchParams.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="SALE">Sale</SelectItem>
                  <SelectItem value="OPENING">Opening</SelectItem>
                  <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                  <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                  <SelectItem value="RETURN_IN">Return In</SelectItem>
                  <SelectItem value="RETURN_OUT">Return Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6">
              <Button type="submit">Apply</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Last 200 matching records.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{r.product?.sku} Â· {r.product?.name}</TableCell>
                    <TableCell>{r.warehouse?.name}</TableCell>
                    <TableCell className="text-right">{Number(r.quantity)}</TableCell>
                    <TableCell>{r.reference ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}