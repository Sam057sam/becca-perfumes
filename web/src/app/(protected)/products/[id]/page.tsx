import { notFound, redirect } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";

export const dynamic = "force-dynamic";

async function getData(id: number) {
  const [product, categories, units] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) return null;
  return { product, categories, units };
}

async function updateAction(id: number, formData: FormData) {
  "use server";
  const raw = Object.fromEntries(formData) as any;
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return;
  }
  const data = parsed.data;

  await prisma.product.update({
    where: { id },
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
      isActive: data.isActive,
    },
  });

  redirect(`/products/${id}`);
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const id = Number(params.id);
  const data = await getData(id);
  const update = updateAction.bind(null, id);
  if (!data) notFound();
  const { product, categories, units } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Product</h1>
          <p className="text-sm text-muted-foreground">Update catalog details.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/products">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>Update base information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={update} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" required defaultValue={product.sku} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" name="barcode" defaultValue={product.barcode ?? ''} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={product.name} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="categoryId" defaultValue={product.categoryId ? String(product.categoryId) : undefined}>
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
              <Select name="unitId" defaultValue={product.unitId ? String(product.unitId) : undefined}>
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
              <Input id="defaultCost" name="defaultCost" type="number" step="0.01" defaultValue={product.defaultCost ? String(product.defaultCost) : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Default Price</Label>
              <Input id="defaultPrice" name="defaultPrice" type="number" step="0.01" defaultValue={product.defaultPrice ? String(product.defaultPrice) : ''} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={product.description ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min Stock</Label>
              <Input id="minStock" name="minStock" type="number" step="0.001" defaultValue={product.minStock ? String(product.minStock) : ''} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isActive" name="isActive" defaultChecked={product.isActive} />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">Save</Button>
              <Button asChild variant="ghost"><Link href="/products">Cancel</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


