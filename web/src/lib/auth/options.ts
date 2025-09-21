import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }).trim(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user?.hashedPassword) {
          return null;
        }

        const isValidPassword = await compare(password, user.hashedPassword);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          role: user.role?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string | null }).role ?? token.role ?? null;
      } else if (token.sub && token.role === undefined) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { role: true },
        });
        token.role = dbUser?.role?.name ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as string | null | undefined) ?? null;
      }

      return session;
    },
  },
  events: {
    async linkAccount({ user }) {
      if (!user.email) {
        return;
      }

      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        include: { role: true },
      });

      if (!userWithRole?.roleId) {
        const defaultRole = await prisma.role.upsert({
          where: { name: "staff" },
          create: {
            name: "staff",
            description: "Default role for newly linked accounts",
          },
          update: {},
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: defaultRole.id },
        });
      }
    },
  },
};
