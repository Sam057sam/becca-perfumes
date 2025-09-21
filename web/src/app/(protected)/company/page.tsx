import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FetchLocationButton } from "@/components/company/fetch-location-button";
import * as fs from "fs/promises";
import * as path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CompanyJson = {
  slug?: string;
  logo?: string | null;
  name: string;
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

async function saveCompanyAction(formData: FormData) {
  "use server";
  const data = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    address1: String(formData.get("address1") || "").trim() || null,
    address2: String(formData.get("address2") || "").trim() || null,
    landmark: String(formData.get("landmark") || "").trim() || null,
    pincode: String(formData.get("pincode") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    state: String(formData.get("state") || "").trim() || null,
    country: String(formData.get("country") || "").trim() || null,
    gstin: String(formData.get("gstin") || "").trim() || null,
    taxId: String(formData.get("taxId") || "").trim() || null,
    currencySymbol: String(formData.get("currencySymbol") || "").trim() || null,
    currencyCode: String(formData.get("currencyCode") || "").trim() || null,
    terms: String(formData.get("terms") || "").trim() || null,
    bankDetails: String(formData.get("bankDetails") || "").trim() || null,
    razorpayApiKey: String(formData.get("razorpayApiKey") || "").trim() || null,
    razorpayApiSecret: String(formData.get("razorpayApiSecret") || "").trim() || null,
    paypalClientId: String(formData.get("paypalClientId") || "").trim() || null,
    paypalSecret: String(formData.get("paypalSecret") || "").trim() || null,
  } as const;

  if (!data.name) return { ok: false, error: "Company name is required" };

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo && typeof logo !== "string") {
    const file = logo as File;
    if (file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = path.extname(file.name) || ".png";
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `company-logo-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      logoUrl = `/uploads/${filename}`;
    }
  }

  const update: Partial<CompanyJson> = { ...data };
  if (logoUrl) (update as CompanyJson).logo = logoUrl;

  const dataDir = path.join(process.cwd(), "data");
  const jsonPath = path.join(dataDir, "company.json");
  await fs.mkdir(dataDir, { recursive: true });
  const existingRaw = await fs
    .readFile(jsonPath, "utf-8")
    .then((t) => t)
    .catch(() => "{}");
  const existing = JSON.parse(existingRaw || "{}");
  const merged = { ...existing, ...update, slug: "default" };
  await fs.writeFile(jsonPath, JSON.stringify(merged, null, 2), "utf-8");

  return { ok: true };
}

function fieldVal(v: string | number | null | undefined, fallback = ""): string | number {
  return v ?? fallback;
}

export default async function CompanyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const dataDir = path.join(process.cwd(), "data");
  const jsonPath = path.join(dataDir, "company.json");
  const company: Partial<CompanyJson> | null = await fs
    .readFile(jsonPath, "utf-8")
    .then((t) => JSON.parse(t) as Partial<CompanyJson>)
    .catch(() => null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Company Details</h1>
          <p className="text-sm text-muted-foreground">This information will appear on your invoices and quotes.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveCompanyAction} className="grid gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <Input id="logo" name="logo" type="file" accept="image/*" />
                {company?.logo ? (
                  <div className="mt-2">
                    <img src={company.logo} alt="Company logo" className="h-16 w-auto" />
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" name="name" required defaultValue={fieldVal(company?.name)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (with country code)</Label>
                <Input id="phone" name="phone" defaultValue={fieldVal(company?.phone)} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email - Company email</Label>
                <Input id="email" name="email" type="email" defaultValue={fieldVal(company?.email)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input id="address1" name="address1" defaultValue={fieldVal(company?.address1)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input id="address2" name="address2" defaultValue={fieldVal(company?.address2)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark</Label>
                <Input id="landmark" name="landmark" defaultValue={fieldVal(company?.landmark)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode / Zip Code</Label>
                <div className="flex gap-2">
                  <Input id="pincode" name="pincode" defaultValue={fieldVal(company?.pincode)} className="w-full" />
                  <FetchLocationButton />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={fieldVal(company?.city)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={fieldVal(company?.state)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" defaultValue={fieldVal(company?.country)} />
              </div>
            </div>

            <div className="grid gap-4">
              <h2 className="text-lg font-semibold">Tax &amp; Currency</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gstin">Company GSTIN</Label>
                  <Input id="gstin" name="gstin" defaultValue={fieldVal(company?.gstin)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">TAXID</Label>
                  <Input id="taxId" name="taxId" defaultValue={fieldVal(company?.taxId)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input id="currencySymbol" name="currencySymbol" defaultValue={fieldVal(company?.currencySymbol)} placeholder="₹" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency Code</Label>
                  <Input id="currencyCode" name="currencyCode" defaultValue={fieldVal(company?.currencyCode)} placeholder="INR" />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <h2 className="text-lg font-semibold">Invoice Settings</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="terms">Terms &amp; Conditions</Label>
                  <Textarea id="terms" name="terms" rows={4} defaultValue={fieldVal(company?.terms)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bankDetails">Bank Details</Label>
                  <Textarea id="bankDetails" name="bankDetails" rows={4} defaultValue={fieldVal(company?.bankDetails)} />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <h2 className="text-lg font-semibold">Payment Gateway Settings</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="razorpayApiKey">Razorpay API Key</Label>
                  <Input id="razorpayApiKey" name="razorpayApiKey" defaultValue={fieldVal(company?.razorpayApiKey)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razorpayApiSecret">Razorpay API Secret</Label>
                  <Input id="razorpayApiSecret" name="razorpayApiSecret" defaultValue={fieldVal(company?.razorpayApiSecret)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypalClientId">Paypal Client ID</Label>
                  <Input id="paypalClientId" name="paypalClientId" defaultValue={fieldVal(company?.paypalClientId)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypalSecret">Paypal Secret</Label>
                  <Input id="paypalSecret" name="paypalSecret" defaultValue={fieldVal(company?.paypalSecret)} />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
