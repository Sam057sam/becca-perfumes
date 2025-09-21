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
    const items = await prisma.warehouse.findMany({ orderBy: { id: "asc" } });
    const rows = items.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code ?? "",
      address: w.address ?? "",
      city: w.city ?? "",
      state: w.state ?? "",
      country: w.country ?? "",
      postalCode: w.postalCode ?? "",
      phone: w.phone ?? "",
      email: w.email ?? "",
      isActive: w.isActive ? "yes" : "no",
    }));
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="warehouses.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || "Export failed" }, { status: 500 });
  }
}
