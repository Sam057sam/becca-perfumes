import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatMoneyNaira(value: number) {
  if (!Number.isFinite(value)) return "?0.00";
  return `?${value.toFixed(2)}`;
}

async function getMetrics() {
  const [skuCount, openPOs, outstandingInvoices] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.purchase.count({ where: { status: "ORDERED" } }),
    prisma.sale.count({ where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
  ]);

  const stocks = await prisma.productWarehouse.findMany({
    include: { product: { select: { defaultCost: true } } },
    take: 5000,
  });

  const inventoryValue = stocks.reduce((sum, row) => {
    const qty = Number(row.quantity);
    const unitCost = row.costAverage != null
      ? Number(row.costAverage)
      : row.product?.defaultCost != null
        ? Number(row.product.defaultCost)
        : 0;
    return sum + qty * unitCost;
  }, 0);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { productStocks: true, unit: true },
    take: 200,
    orderBy: { name: "asc" },
  });

  const lowStock = products
    .map((p) => {
      const onHand = p.productStocks.reduce((acc, s) => acc + Number(s.quantity), 0);
      const min = p.minStock ? Number(p.minStock) : 0;
      return { id: p.id, name: p.name, sku: p.sku, unit: p.unit?.symbol ?? p.unit?.name ?? "", onHand, min };
    })
    .filter((x) => x.min > 0 && x.onHand < x.min)
    .slice(0, 5);

  const recentMoves = await prisma.stockMovement.findMany({
    orderBy: { id: "desc" },
    take: 10,
    include: {
      product: { select: { sku: true, name: true } },
      warehouse: { select: { name: true } },
    },
  });

  return { skuCount, inventoryValue, openPOs, outstandingInvoices, lowStock, recentMoves };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { skuCount, inventoryValue, openPOs, outstandingInvoices, lowStock, recentMoves } = await getMetrics();

  const metrics = [
    { label: "Stock keeping units", description: "Active products being tracked", value: String(skuCount) },
    { label: "Inventory value", description: "Based on latest cost prices", value: formatMoneyNaira(inventoryValue) },
    { label: "Open purchase orders", description: "Awaiting receipt", value: String(openPOs) },
    { label: "Outstanding invoices", description: "Sales awaiting payment", value: String(outstandingInvoices) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back {session.user.name ?? ""}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{m.label}</CardTitle>
              <CardDescription>{m.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent stock movements</CardTitle>
            <CardDescription>Last 10 adjustments, sales, and receipts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {recentMoves.length === 0 ? (
                <p className="text-muted-foreground">No stock movements yet.</p>
              ) : (
                recentMoves.map((mv) => (
                  <div key={mv.id} className="flex items-center justify-between border-b py-2 last:border-b-0">
                    <div>
                      <p className="font-medium">{mv.product?.sku ?? "-"} · {mv.product?.name ?? "Product"}</p>
                      <p className="text-muted-foreground">
                        {mv.type} · {mv.warehouse?.name ?? "Warehouse"}
                      </p>
                    </div>
                    <div className="text-right font-medium">{Number(mv.quantity)}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>Items below minimum level.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {lowStock.length === 0 ? (
                <p className="text-muted-foreground">No low stock items right now.</p>
              ) : (
                lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b py-2 last:border-b-0">
                    <div>
                      <p className="font-medium">{p.sku} · {p.name}</p>
                      <p className="text-muted-foreground">Min {p.min} {p.unit}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{p.onHand}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>The dashboard populates after you add records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ul className="space-y-2">
            <li>- Add warehouses and units of measure.</li>
            <li>- Import or create product catalog records.</li>
            <li>- Record opening stock or pending purchase orders.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

