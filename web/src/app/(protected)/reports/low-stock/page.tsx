import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function getData() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { productStocks: true, unit: true },
    orderBy: { name: "asc" },
    take: 1000,
  });

  const rows = products
    .map((p) => {
      const onHand = p.productStocks.reduce((acc, s) => acc + Number(s.quantity), 0);
      const min = p.minStock ? Number(p.minStock) : 0;
      return { id: p.id, sku: p.sku, name: p.name, unit: p.unit?.symbol ?? p.unit?.name ?? "", onHand, min };
    })
    .filter((x) => x.min > 0 && x.onHand < x.min);

  return rows;
}

export default async function LowStockReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  const rows = await getData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Low Stock</h1>
          <p className="text-sm text-muted-foreground">Products below minimum level.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products below min</CardTitle>
          <CardDescription>Review and plan replenishment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No low stock products.</TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium"><Link href={`/products/${r.id}`} className="underline-offset-2 hover:underline">{r.sku}</Link></TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.unit}</TableCell>
                      <TableCell className="text-right">{r.onHand}</TableCell>
                      <TableCell className="text-right">{r.min}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}