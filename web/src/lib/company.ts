import * as fs from "fs/promises";
import * as path from "path";

export type CompanySettings = {
  slug?: string;
  logo?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address1?: string | null;
  address2?: string | null;
  landmark?: string | null;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  gstin?: string | null;
  taxId?: string | null;
  currencySymbol?: string | null;
  currencyCode?: string | null;
  terms?: string | null;
  bankDetails?: string | null;
  razorpayApiKey?: string | null;
  razorpayApiSecret?: string | null;
  paypalClientId?: string | null;
  paypalSecret?: string | null;
};

let cached: CompanySettings | null = null;
let cacheTime = 0;
const CACHE_MS = 15_000;

export async function getCompany(): Promise<CompanySettings> {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_MS) return cached;
  try {
    const dataDir = path.join(process.cwd(), "data");
    const jsonPath = path.join(dataDir, "company.json");
    const raw = await fs.readFile(jsonPath, "utf-8");
    const parsed = JSON.parse(raw) as CompanySettings;
    cached = parsed || {};
  } catch {
    cached = {};
  }
  cacheTime = now;
  return cached;
}

export async function getCurrencySymbol(): Promise<string> {
  const company = await getCompany();
  return (company.currencySymbol?.trim() || "₹");
}

export function formatAmountWithSymbol(amount: number, symbol: string): string {
  if (!Number.isFinite(amount)) return `${symbol}0.00`;
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol}${formatted}`;
}

