import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "VIEW_SETTINGS",
        method: "GET",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({
      admin: {
        id: admin.id,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
        lastPasswordChange: admin.lastPasswordChange,
        user: admin.user,
      },
    });
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { permissions } = data;

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Invalid permissions format" },
        { status: 400 }
      );
    }

    // Only super admins can modify permissions
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    // Update admin permissions
    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: { permissions },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_SETTINGS",
        method: "PATCH",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          permissions,
        },
      },
    });

    return NextResponse.json({
      admin: {
        id: updatedAdmin.id,
        role: updatedAdmin.role,
        permissions: updatedAdmin.permissions,
        lastLogin: updatedAdmin.lastLogin,
        lastPasswordChange: updatedAdmin.lastPasswordChange,
        user: updatedAdmin.user,
      },
    });
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
