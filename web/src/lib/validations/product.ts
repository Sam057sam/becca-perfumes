import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, { message: "SKU is required" }).trim(),
  name: z.string().min(1, { message: "Name is required" }).trim(),
  description: z.string().optional().transform((v) => v?.trim() || undefined),
  barcode: z.string().optional().transform((v) => v?.trim() || undefined),
  categoryId: z.coerce.number().int().positive().optional().or(z.literal(0)).transform((v) => (v ? Number(v) : undefined)),
  unitId: z.coerce.number().int().positive().optional().or(z.literal(0)).transform((v) => (v ? Number(v) : undefined)),
  defaultCost: z.coerce.number().nonnegative().optional(),
  defaultPrice: z.coerce.number().nonnegative().optional(),
  minStock: z.coerce.number().nonnegative().optional(),
  isActive: z.coerce.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
