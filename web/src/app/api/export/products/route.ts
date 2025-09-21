import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

type CsvValue = string | number | boolean | null | undefined;
function toCsv(rows: Array<Record<string, CsvValue>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: CsvValue) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
      include: { category: true, unit: true, productStocks: true },
    });

    const rows = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category?.name ?? "",
      unit: p.unit?.symbol ?? p.unit?.name ?? "",
      minStock: p.minStock ? String(p.minStock) : "",
      isActive: p.isActive ? "yes" : "no",
      onHand: p.productStocks.reduce((sum, s) => sum + Number(s.quantity), 0),
      defaultCost: p.defaultCost ? String(p.defaultCost) : "",
      defaultPrice: p.defaultPrice ? String(p.defaultPrice) : "",
    }));

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="products.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || "Export failed" }, { status: 500 });
  }
}
