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

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter =
      startDate && endDate
        ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {};

    // Fetch all relevant data in parallel
    const [
      user,
      subscription,
      analytics,
      income,
      supportTickets,
      notifications,
    ] = await Promise.all([
      // User data with platform connections
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          email: true,
          platforms: true,
          settings: true,
          emailVerified: true,
        },
      }),

      // Active subscription
      prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          status: { in: ["active", "trialing"] },
        },
      }),

      // Analytics data
      prisma.analytics.findMany({
        where: {
          userId: session.user.id,
          ...dateFilter,
        },
        orderBy: { date: "desc" },
      }),

      // Income data
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          ...dateFilter,
        },
        orderBy: { date: "desc" },
      }),

      // Support tickets
      prisma.support.findMany({
        where: {
          userId: session.user.id,
          status: "open",
        },
        include: {
          responses: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Unread notifications
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Calculate summary statistics
    const totalIncome = income.reduce((sum, record) => sum + record.amount, 0);
    const incomeByPlatform = income.reduce(
      (acc: Record<string, number>, record) => {
        acc[record.platform] = (acc[record.platform] || 0) + record.amount;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      user,
      subscription,
      analytics,
      income: {
        records: income,
        total: totalIncome,
        byPlatform: incomeByPlatform,
      },
      supportTickets,
      notifications,
      platformConnections: {
        youtube: !!user?.platforms?.youtube,
        tiktok: !!user?.platforms?.tiktok,
        spotify: !!user?.platforms?.spotify,
        patreon: !!user?.platforms?.patreon,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
