import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getCurrencySymbol, formatAmountWithSymbol } from "@/lib/company";

export const dynamic = "force-dynamic";
function formatMoneyNaira(value: number) {
  if (!Number.isFinite(value)) return "₦0.00";
  return `₦${value.toFixed(2)}`;
}

function dayRange(from?: string, to?: string) {
  const now = new Date();
  const startBase = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endBase = to ? new Date(to) : startBase;
  const start = new Date(startBase.getFullYear(), startBase.getMonth(), startBase.getDate());
  const end = new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate() + 1);
  return { start, end };
}

async function getMetrics(from?: string, to?: string) {
  const { start, end } = dayRange(from, to);

  const [skuCount, openPOs, outstandingInvoices, whCount, unitCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.purchase.count({ where: { status: "ORDERED" } }),
    prisma.sale.count({ where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
    prisma.warehouse.count({ where: { isActive: true } }),
    prisma.unit.count(),
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

  const [salesToday, purchasesReceived, expensesToday, movementToday] = await Promise.all([
    prisma.sale.findMany({ where: { issuedAt: { gte: start, lt: end }, status: { in: ["CONFIRMED", "FULFILLED"] } }, select: { total: true } }),
    prisma.purchase.count({ where: { receivedAt: { gte: start, lt: end } } }),
    prisma.expense.findMany({ where: { incurredAt: { gte: start, lt: end } }, select: { amount: true } }),
    prisma.stockMovement.count({ where: { createdAt: { gte: start, lt: end } } }),
  ]);

  const salesTotal = salesToday.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const expensesTotal = expensesToday.reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return { skuCount, inventoryValue, openPOs, outstandingInvoices, whCount, unitCount, lowStock, recentMoves, salesTotal, purchasesReceived, expensesTotal, movementToday };
}

export default async function DashboardPage({ searchParams }: { searchParams?: { from?: string; to?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { skuCount, inventoryValue, openPOs, outstandingInvoices, whCount, unitCount, lowStock, recentMoves, salesTotal, purchasesReceived, expensesTotal, movementToday } = await getMetrics(searchParams?.from, searchParams?.to);
  const currencySymbol = await getCurrencySymbol();
  const fmt = (v: number) => formatAmountWithSymbol(v, currencySymbol);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back {session.user.name ?? ""}.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="block text-sm text-muted-foreground">From</label>
          <input className="mt-1 rounded-md border px-3 py-2" type="date" name="from" defaultValue={searchParams?.from} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">To</label>
          <input className="mt-1 rounded-md border px-3 py-2" type="date" name="to" defaultValue={searchParams?.to} />
        </div>
        <button className="rounded-md border px-3 py-2" type="submit">Apply</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Stock keeping units", description: "Active products being tracked", value: String(skuCount), href: "/products" },
          { label: "Inventory value", description: "Based on latest cost prices", value: fmt(inventoryValue), href: "/reports/movements" },
          { label: "Open purchase orders", description: "Awaiting receipt", value: String(openPOs), href: "/purchases" },
          { label: "Outstanding invoices", description: "Sales awaiting payment", value: String(outstandingInvoices), href: "/sales" },
        ].map((m) => (
          <KpiCard key={m.label} label={m.label} description={m.description} value={m.value} href={m.href} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s sales</CardTitle>
            <CardDescription>Sum of invoices issued.</CardDescription>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{fmt(salesTotal)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Movements</CardTitle>
            <CardDescription>Transactions today.</CardDescription>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{movementToday}</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Incurred today.</CardDescription>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{fmt(expensesTotal)}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Warehouses</CardTitle>
            <CardDescription>Active locations</CardDescription>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold"><a href="/warehouses" className="underline-offset-2 hover:underline">{whCount} locations</a></p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <CardDescription>Units of measure</CardDescription>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold"><a href="/units" className="underline-offset-2 hover:underline">{unitCount} units</a></p></CardContent>
        </Card>
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
