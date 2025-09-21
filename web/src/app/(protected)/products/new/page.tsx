import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const dynamic = "force-dynamic";

async function getLookups() {
  const [categories, units] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { categories, units };
}

async function createAction(formData: FormData) {
  "use server";
  const raw = Object.fromEntries(formData) as any;
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    // For now, just stay on page. Could add formState later.
    return;
  }
  const data = parsed.data;

  await prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description,
      barcode: data.barcode,
      categoryId: data.categoryId,
      unitId: data.unitId,
      defaultCost: data.defaultCost ? String(data.defaultCost) : undefined,
      defaultPrice: data.defaultPrice ? String(data.defaultPrice) : undefined,
      minStock: data.minStock ? String(data.minStock) : undefined,
    },
  });

  redirect("/products");
}

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const { categories, units } = await getLookups();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New Product</h1>
          <p className="text-sm text-muted-foreground">Create a new catalog item.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/products">Cancel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>Basic information used for stock and sales.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" required placeholder="e.g. PRF-100ML-ABC" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" name="barcode" placeholder="optional" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Becca Essence 100ml" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="categoryId">
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select name="unitId">
                <SelectTrigger>
                  <SelectValue placeholder="Select unit (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCost">Default Cost</Label>
              <Input id="defaultCost" name="defaultCost" type="number" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Default Price</Label>
              <Input id="defaultPrice" name="defaultPrice" type="number" step="0.01" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min Stock</Label>
              <Input id="minStock" name="minStock" type="number" step="0.001" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="reset" variant="outline">Reset</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
