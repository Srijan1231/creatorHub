import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MOCK_DASHBOARD_DATA } from "@/lib/mock-data";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

// Add dynamic config to prevent static export errors
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          ...MOCK_DASHBOARD_DATA,
        },
        { status: 401 }
      );
    }

    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_DASHBOARD_DATA);
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    const now = new Date();
    let startDate = new Date();

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

    // Fetch data in parallel
    const [analytics, income] = await Promise.all([
      prisma.analytics.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: {
          date: "asc",
        },
      }),
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: {
          date: "asc",
        },
      }),
    ]);

    // Initialize platform metrics
    const platformMetrics: { [key: string]: any } = {
      youtube: {
        followers: 0,
        views: 0,
        engagement: 0,
        earnings: 0,
        history: [],
      },
      tiktok: {
        followers: 0,
        views: 0,
        engagement: 0,
        earnings: 0,
        history: [],
      },
      spotify: {
        followers: 0,
        views: 0,
        engagement: 0,
        earnings: 0,
        history: [],
      },
      patreon: {
        followers: 0,
        views: 0,
        engagement: 0,
        earnings: 0,
        history: [],
      },
    };

    // Process analytics data
    analytics.forEach((record) => {
      const platform = record.platform;
      const metrics = record.metrics as any;
      platformMetrics[platform].followers =
        metrics.followers || metrics.subscribers || metrics.patrons || 0;
      platformMetrics[platform].views = metrics.views || metrics.streams || 0;
      platformMetrics[platform].history.push({
        date: record.date.toISOString().split("T")[0],
        followers:
          metrics.followers || metrics.subscribers || metrics.patrons || 0,
        views: metrics.views || metrics.streams || 0,
      });
    });

    // Process income data
    income.forEach((record) => {
      platformMetrics[record.platform].earnings += record.amount;
    });

    // Calculate totals
    const totals = {
      followers: 0,
      views: 0,
      earnings: 0,
      platforms: Object.keys(platformMetrics).filter(
        (platform) =>
          platformMetrics[platform].followers > 0 ||
          platformMetrics[platform].views > 0 ||
          platformMetrics[platform].earnings > 0
      ).length,
    };

    Object.values(platformMetrics).forEach((metrics: any) => {
      totals.followers += metrics.followers;
      totals.views += metrics.views;
      totals.earnings += metrics.earnings;
    });

    // Generate timeline data
    const timeline = analytics.reduce((acc: any[], record) => {
      const date = record.date.toISOString().split("T")[0];
      const metrics = record.metrics as any;
      const existingEntry = acc.find((entry) => entry.date === date);

      if (existingEntry) {
        existingEntry[record.platform] = {
          followers:
            metrics.followers || metrics.subscribers || metrics.patrons || 0,
          views: metrics.views || metrics.streams || 0,
        };
      } else {
        acc.push({
          date,
          [record.platform]: {
            followers:
              metrics.followers || metrics.subscribers || metrics.patrons || 0,
            views: metrics.views || metrics.streams || 0,
          },
        });
      }

      return acc;
    }, []);

    return NextResponse.json({
      totals,
      platformMetrics,
      timeline,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json(MOCK_DASHBOARD_DATA);
  }
}
