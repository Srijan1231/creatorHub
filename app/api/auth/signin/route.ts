import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if this is a super admin login attempt
    if (
      email === process.env.SUPER_ADMIN_EMAIL &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      // Check if super admin already exists
      const existingAdmin = await prisma.admin.findFirst({
        where: { role: "super_admin" },
      });

      if (!existingAdmin) {
        // First-time super admin login - create the account
        const hashedPassword = await hash(password, 12);

        // Create user account
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: "Super Admin",
            emailVerified: true,
            settings: {
              emailNotifications: true,
              pushNotifications: true,
              theme: "system",
              currency: "USD",
            },
            admin: {
              create: {
                role: "super_admin",
                permissions: [
                  "manage_users",
                  "manage_subscriptions",
                  "manage_support",
                  "view_analytics",
                  "manage_platform",
                  "manage_admins",
                ],
                lastLogin: new Date(),
              },
            },
          },
          include: {
            admin: true,
          },
        });

        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "super_admin",
          },
        });
      }
    }

    // Regular login flow
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        admin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // For existing super admin, verify against environment variables
    if (user.admin?.role === "super_admin") {
      if (
        email !== process.env.SUPER_ADMIN_EMAIL ||
        password !== process.env.SUPER_ADMIN_PASSWORD
      ) {
        return NextResponse.json(
          { error: "Invalid super admin credentials" },
          { status: 401 }
        );
      }
    }

    // Update last login for admin
    if (user.admin) {
      await prisma.admin.update({
        where: { id: user.admin.id },
        data: {
          lastLogin: new Date(),
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.admin?.role || "user",
      },
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
