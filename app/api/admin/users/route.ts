import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const whereClause: Prisma.UserWhereInput = {
      OR: [
        { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
        {
          email: { contains: search, mode: "insensitive" as Prisma.QueryMode },
        },
      ],
      ...(status === "suspended" ? { suspended: true } : {}),
      ...(status === "active" ? { suspended: false } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          admin: {
            select: {
              role: true,
              permissions: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: whereClause,
      }),
    ]);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "VIEW_USERS",
        method: "GET",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          search,
          status,
          page,
          limit,
        },
      },
    });

    return NextResponse.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
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
    const { id, suspended } = data;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: { suspended: suspended ?? false },
      include: {
        admin: {
          select: {
            role: true,
            permissions: true,
          },
        },
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: suspended ? "SUSPEND_USER" : "UNSUSPEND_USER",
        method: "PATCH",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          userId: id,
          suspended,
        },
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: id,
        type: "admin",
        title: suspended ? "Account Suspended" : "Account Reactivated",
        message: suspended
          ? "Your account has been suspended by an administrator."
          : "Your account has been reactivated by an administrator.",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Admin users error:", error);
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Delete user and all related data
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.response.deleteMany({ where: { userId: id } }),
      prisma.support.deleteMany({ where: { userId: id } }),
      prisma.income.deleteMany({ where: { userId: id } }),
      prisma.analytics.deleteMany({ where: { userId: id } }),
      prisma.admin.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE_USER",
        method: "DELETE",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          userId: id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
