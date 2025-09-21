import { hash } from "bcrypt";

import { AuditAction, PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: "admin", description: "Full system access" },
    { name: "manager", description: "Manage daily operations" },
    { name: "cashier", description: "Point of sale and expense capture" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }

  await prisma.unit.upsert({
    where: { symbol: "ea" },
    update: {
      name: "Each",
      symbol: "ea",
      precision: 0,
    },
    create: {
      name: "Each",
      symbol: "ea",
      precision: 0,
    },
  });

  await prisma.unit.upsert({
    where: { symbol: "ml" },
    update: {
      name: "Milliliter",
      symbol: "ml",
      precision: 2,
    },
    create: {
      name: "Milliliter",
      symbol: "ml",
      precision: 2,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: {
      name: "Main Warehouse",
      isActive: true,
    },
    create: {
      code: "MAIN",
      name: "Main Warehouse",
      isActive: true,
    },
  });

  const rootCategory = await prisma.category.findFirst({
    where: { name: "Fragrances", parentId: null },
  });
  if (rootCategory) {
    await prisma.category.update({
      where: { id: rootCategory.id },
      data: { description: "Fragrance and perfume catalog" },
    });
  } else {
    await prisma.category.create({
      data: {
        name: "Fragrances",
        description: "Fragrance and perfume catalog",
      },
    });
  }

  const expenseCategories = [
    { name: "Rent", description: "Office and warehouse rent" },
    { name: "Utilities", description: "Electricity, water, and other utilities" },
    { name: "Marketing", description: "Advertising and promotional spend" },
  ];

  for (const category of expenseCategories) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { name: category.name, parentId: null },
    });
    if (existing) {
      await prisma.expenseCategory.update({
        where: { id: existing.id },
        data: category,
      });
    } else {
      await prisma.expenseCategory.create({ data: category });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@becca.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const hashedPassword = await hash(adminPassword, 12);

  const adminRole = await prisma.role.findUnique({
    where: { name: "admin" },
  });

  if (!adminRole) {
    throw new Error("Admin role was not created successfully.");
  }

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "System Administrator",
      hashedPassword,
      roleId: adminRole.id,
    },
    create: {
      email: adminEmail,
      name: "System Administrator",
      hashedPassword,
      roleId: adminRole.id,
    },
    include: {
      role: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: AuditAction.CREATE,
      entity: "seed",
      entityId: warehouse.id.toString(),
      metadata: {
        message: "Initial seed data applied",
      },
    },
  });

  console.log("Seed completed successfully.");
  console.log(`Admin credentials -> email: ${adminUser.email} | password: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
