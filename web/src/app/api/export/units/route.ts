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
    const units = await prisma.unit.findMany({ orderBy: { id: "asc" } });
    const rows = units.map((u) => ({ id: u.id, name: u.name, symbol: u.symbol ?? "", precision: u.precision }));
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="units.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || "Export failed" }, { status: 500 });
  }
}
