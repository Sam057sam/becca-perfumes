import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function adjustStock(formData: FormData) {
  "use server";
  const productId = Number(formData.get("productId"));
  const warehouseId = Number(formData.get("warehouseId"));
  const quantity = Number(formData.get("quantity"));
  const reason = String(formData.get("reason") || "");

  if (!productId || !warehouseId || !quantity) return;

  const current = await prisma.productWarehouse.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    create: { productId, warehouseId, quantity: "0" },
    update: {},
  });

  const newQty = Number(current.quantity) + quantity;

  await prisma.$transaction([
    prisma.productWarehouse.update({
      where: { productId_warehouseId: { productId, warehouseId } },
      data: { quantity: String(newQty) },
    }),
    prisma.stockMovement.create({
      data: {
        productId,
        warehouseId,
        type: "ADJUSTMENT",
        quantity: String(quantity),
        reference: "MANUAL_ADJUST",
        notes: reason || undefined,
      },
    }),
  ]);
}

async function getData() {
  const [products, warehouses] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { category: true, unit: true, productStocks: true },
      take: 100,
    }),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category?.name ?? "-",
    unit: p.unit?.symbol ?? p.unit?.name ?? "",
    stock: p.productStocks.reduce((sum, s) => sum + Number(s.quantity), 0),
  }));

  return { rows, warehouses };
}

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const { rows, warehouses } = await getData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Catalog and on-hand stock.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/api/export/products">Export CSV</Link>
          </Button>
          <Button asChild>
            <Link href="/products/new">New Product</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>First 100 products by name.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-[360px]">Adjust</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link className="underline-offset-2 hover:underline" href={`/products/${row.id}`}>{row.sku}</Link>
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell className="text-right">{row.stock}</TableCell>
                    <TableCell>
                      <form action={adjustStock} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={row.id} />
                        <Select name="warehouseId">
                          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Warehouse" /></SelectTrigger>
                          <SelectContent>
                            {warehouses.map((w) => (
                              <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input name="quantity" type="number" placeholder="Qty (+/-)" className="w-[120px]" required />
                        <Input name="reason" placeholder="Reason (optional)" className="w-[200px]" />
                        <Button type="submit" variant="outline">Apply</Button>
                      </form>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={async (fd) => {
                        'use server';
                        const { deleteProductAction } = await import('./actions');
                        fd.set('id', String(row.id));
                        await deleteProductAction(fd);
                      }}>
                        <Button type="submit" variant="destructive" size="sm">Delete</Button>
                      </form>
                    </TableCell>
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
