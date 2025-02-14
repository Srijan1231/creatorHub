/**
 * Enhanced admin middleware with security features
 * - Rate limiting
 * - Action logging
 * - Permission checks
 * - Password expiry
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

// Stricter rate limiting for admin routes
const adminLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 100,
});

/**
 * Check if the current user has admin privileges
 * @param req - Incoming request object
 * @returns boolean indicating admin status
 */
export async function isAdmin(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return false;

    // Apply rate limiting
    try {
      await adminLimiter.check(req);
    } catch {
      throw new Error("Rate limit exceeded");
    }

    const admin = await prisma.admin.findFirst({
      where: {
        userId: session.user.id,
        suspended: false,
      },
    });

    return !!admin;
  } catch {
    return false;
  }
}

/**
 * Check if the current user has super admin privileges
 * @param req - Incoming request object
 * @returns boolean indicating super admin status
 */
export async function isSuperAdmin(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return false;

    // Apply rate limiting
    try {
      await adminLimiter.check(req);
    } catch {
      throw new Error("Rate limit exceeded");
    }

    const admin = await prisma.admin.findFirst({
      where: {
        userId: session.user.id,
        role: "super_admin",
        suspended: false,
        lastPasswordChange: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days password expiry
        },
      },
    });

    return !!admin;
  } catch {
    return false;
  }
}

/**
 * Middleware to require admin privileges
 * @param req - Incoming request object
 * @returns Response object if unauthorized, null if authorized
 */
export async function requireAdmin(req: Request) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log admin action
    await logAdminAction(req);

    return null;
  } catch (error) {
    if (error instanceof Error && error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Middleware to require super admin privileges
 * @param req - Incoming request object
 * @returns Response object if unauthorized, null if authorized
 */
export async function requireSuperAdmin(req: Request) {
  try {
    if (!(await isSuperAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log super admin action
    await logAdminAction(req, true);

    return null;
  } catch (error) {
    if (error instanceof Error && error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Log admin actions for audit trail
 * @param req - Incoming request object
 * @param isSuperAdmin - Whether the action was performed by a super admin
 */
async function logAdminAction(req: Request, isSuperAdmin = false) {
  try {
    const session = await getServerSession(authOptions);
    const { pathname } = new URL(req.url);

    const admin = await prisma.admin.findFirst({
      where: { userId: session!.user.id },
    });

    if (!admin) return;

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: pathname,
        method: req.method,
        isSuperAdmin,
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}
