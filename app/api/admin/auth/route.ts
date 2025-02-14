import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 50,
});

export async function GET(req: Request) {
  try {
    // Apply rate limiting
    try {
      await authLimiter.check(req);
    } catch {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findFirst({
      where: {
        userId: session.user.id,
        suspended: false,
      },
      include: {
        user: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check password expiry for super admin
    if (admin.role === "super_admin") {
      const lastPasswordChange = admin.lastPasswordChange || admin.createdAt;
      const daysUntilExpiry =
        90 -
        Math.floor(
          (Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
        );

      if (daysUntilExpiry <= 0) {
        return NextResponse.json(
          { error: "Password expired", requiresPasswordChange: true },
          { status: 401 }
        );
      }
    }

    // Update last login and log the authentication
    const [updatedAdmin, _] = await Promise.all([
      prisma.admin.update({
        where: { id: admin.id },
        data: {
          lastLogin: new Date(),
        },
      }),
      prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: "auth.login",
          method: "GET",
          isSuperAdmin: admin.role === "super_admin",
          ip: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      }),
    ]);

    return NextResponse.json({
      role: admin.role,
      permissions: admin.permissions,
      lastLogin: updatedAdmin.lastLogin,
      requiresPasswordChange: false,
      daysUntilPasswordExpiry:
        admin.role === "super_admin"
          ? 90 -
            Math.floor(
              (Date.now() -
                (admin.lastPasswordChange || admin.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
