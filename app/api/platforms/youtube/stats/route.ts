import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldUseMockData } from "@/lib/mock-data";
import {
  getMockYouTubeStats,
  simulateApiDelay,
} from "@/lib/mock-platform-data";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (shouldUseMockData()) {
      await simulateApiDelay();
      return NextResponse.json(getMockYouTubeStats());
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        platforms: true,
      },
    });

    if (!user?.platforms?.youtube?.accessToken) {
      return NextResponse.json(
        { error: "YouTube not connected" },
        { status: 400 }
      );
    }

    // Fetch YouTube stats using the access token
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${user.platforms.youtube.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch YouTube statistics");
    }

    const data = await response.json();

    // Store analytics
    await prisma.analytics.create({
      data: {
        userId: session.user.id,
        platform: "youtube",
        date: new Date(),
        metrics: {
          subscribers: parseInt(data.items[0].statistics.subscriberCount),
          views: parseInt(data.items[0].statistics.viewCount),
        },
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("YouTube stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
