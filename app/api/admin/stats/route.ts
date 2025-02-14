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

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get various statistics
    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalIncome,
      totalTickets,
      openTickets,
      totalAdmins,
      users,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      // New users in period
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
      }),
      // Active users (with active subscription)
      prisma.user.count({
        where: {
          suspended: false,
          emailVerified: true,
        },
      }),
      // Total income in period
      prisma.income.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      // Total support tickets
      prisma.support.count(),
      // Open support tickets
      prisma.support.count({
        where: {
          status: "open",
        },
      }),
      // Total admins
      prisma.admin.count(),
      // Get all users with their platforms
      prisma.user.findMany({
        select: {
          platforms: true,
        },
      }),
    ]);

    // Calculate platform usage
    const platforms = {
      youtube: 0,
      tiktok: 0,
      spotify: 0,
      patreon: 0,
    };

    users.forEach((user) => {
      if (user.platforms?.youtube) platforms.youtube++;
      if (user.platforms?.tiktok) platforms.tiktok++;
      if (user.platforms?.spotify) platforms.spotify++;
      if (user.platforms?.patreon) platforms.patreon++;
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "VIEW_STATS",
        method: "GET",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          period,
        },
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
      },
      income: {
        total: totalIncome._sum.amount || 0,
      },
      support: {
        total: totalTickets,
        open: openTickets,
      },
      admins: {
        total: totalAdmins,
      },
      platforms,
      period,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
