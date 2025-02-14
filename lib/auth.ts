import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { admin: true },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Check if user is suspended
        if (user.suspended) {
          throw new Error("Account suspended");
        }

        // For super admin, verify against environment variables
        if (user.admin?.role === "super_admin") {
          if (
            credentials.email !== process.env.SUPER_ADMIN_EMAIL ||
            credentials.password !== process.env.SUPER_ADMIN_PASSWORD
          ) {
            throw new Error("Invalid super admin credentials");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.admin?.role || "user",
          onboardingCompleted: user.settings.onboardingCompleted || false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.onboardingCompleted = user.onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
