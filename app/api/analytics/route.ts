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
    const platform = searchParams.get("platform");
    const period = searchParams.get("period") || "30d"; // Default to 30 days

    // Calculate date range based on period
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

    // Build where clause based on platform filter
    const whereClause = {
      userId: session.user.id,
      createdAt: {
        gte: startDate,
        lte: now,
      },
      ...(platform ? { platform } : {}),
    };

    // Get analytics data
    const analytics = await prisma.analytics.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to last 100 records
      select: {
        id: true,
        createdAt: true,
        platform: true,
        metrics: true,
      },
    });

    // Calculate totals from metrics
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    analytics.forEach((record) => {
      const metrics = record.metrics as any;
      totalViews += metrics.views || metrics.streams || 0;
      totalLikes += metrics.likes || 0;
      totalComments += metrics.comments || 0;
    });

    // Calculate engagement rate
    const totalEngagement = totalLikes + totalComments;
    const engagementRate = totalViews
      ? ((totalEngagement / totalViews) * 100).toFixed(2)
      : "0";

    return NextResponse.json({
      analytics: analytics.map((record) => ({
        ...record,
        metrics: record.metrics as any,
      })),
      summary: {
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        engagementRate: `${engagementRate}%`,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
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

    const data = await req.json();
    const { platform, views, likes, comments } = data;

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    const analytics = await prisma.analytics.create({
      data: {
        userId: session.user.id,
        platform,
        date: new Date(),
        metrics: {
          views: views || 0,
          likes: likes || 0,
          comments: comments || 0,
        },
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
