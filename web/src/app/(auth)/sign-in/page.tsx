import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { SignInForm } from "@/components/auth/sign-in-form";
import { authOptions } from "@/lib/auth/options";

export const metadata: Metadata = {
  title: "Sign in | Becca Perfumes",
  description: "Access the Becca Perfumes management console.",
};

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-muted/30 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-center">
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage inventory, sales, and expenses with confidence
          </h1>
          <p className="text-muted-foreground">
            Sign in to track stock levels, log expenses, and monitor performance across your business.
          </p>
        </div>
        <div className="flex justify-center md:flex-1">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}