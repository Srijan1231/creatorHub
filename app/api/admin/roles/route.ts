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
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Only super admins can view roles
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");

    const skip = (page - 1) * limit;

    const whereClause = {
      ...(role ? { role } : {}),
    };

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
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
        skip,
        take: limit,
      }),
      prisma.admin.count({
        where: whereClause,
      }),
    ]);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "VIEW_ROLES",
        method: "GET",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          role,
          page,
          limit,
        },
      },
    });

    return NextResponse.json({
      admins,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Admin roles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    // Only super admins can create new admins
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { userId, role = "admin", permissions = [] } = data;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already an admin
    const existingAdmin = await prisma.admin.findUnique({
      where: { userId },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "User is already an admin" },
        { status: 400 }
      );
    }

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        userId,
        role,
        permissions,
        lastLogin: new Date(),
      },
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
        action: "CREATE_ADMIN",
        method: "POST",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          userId,
          role,
          permissions,
        },
      },
    });

    // Create notification for the new admin
    await prisma.notification.create({
      data: {
        userId,
        type: "admin",
        title: "Admin Access Granted",
        message: `You have been granted ${role} access to the admin panel.`,
      },
    });

    return NextResponse.json(newAdmin);
  } catch (error) {
    console.error("Admin roles error:", error);
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

    // Only super admins can modify roles
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { id, role, permissions } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Update admin role
    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(permissions ? { permissions } : {}),
      },
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
        action: "UPDATE_ADMIN",
        method: "PATCH",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          adminId: id,
          role,
          permissions,
        },
      },
    });

    // Create notification for the updated admin
    await prisma.notification.create({
      data: {
        userId: updatedAdmin.userId,
        type: "admin",
        title: "Admin Role Updated",
        message: `Your admin role has been updated to ${
          role || "the same role"
        }.`,
      },
    });

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error("Admin roles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
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

    // Only super admins can delete admins
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Get admin before deletion for notification
    const adminToDelete = await prisma.admin.findUnique({
      where: { id },
    });

    if (!adminToDelete) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Cannot delete super admin
    if (adminToDelete.role === "super_admin") {
      return NextResponse.json(
        { error: "Cannot delete super admin" },
        { status: 403 }
      );
    }

    // Delete admin
    await prisma.admin.delete({
      where: { id },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_ADMIN",
        method: "DELETE",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          adminId: id,
        },
      },
    });

    // Create notification for the deleted admin
    await prisma.notification.create({
      data: {
        userId: adminToDelete.userId,
        type: "admin",
        title: "Admin Access Revoked",
        message: "Your admin access has been revoked.",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin roles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
