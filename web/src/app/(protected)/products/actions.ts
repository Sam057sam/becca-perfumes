"use server";

import { prisma } from "@/lib/prisma";

export async function deleteProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, error: "Missing id" };
  try {
    await prisma.product.delete({ where: { id } });
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return { ok: false, error: message };
  }
}
