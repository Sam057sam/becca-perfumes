import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { MainNav } from "@/components/nav/main-nav";
import { UserMenu } from "@/components/nav/user-menu";
import { getCompany } from "@/lib/company";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const company = await getCompany();
  const brand = { name: company.name ?? "Becca Perfumes", logo: company.logo ?? null };

  return (
    <div className="min-h-screen bg-muted/20">
      <MainNav brand={brand} />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
        <div className="flex items-center justify-end">
          <UserMenu />
        </div>
        {children}
      </div>
    </div>
  );
}
