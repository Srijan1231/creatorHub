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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        platforms: true,
      },
    });

    if (!user?.platforms?.spotify?.accessToken) {
      return NextResponse.json(
        { error: "Spotify not connected" },
        { status: 400 }
      );
    }

    // Fetch Spotify artist stats
    const response = await fetch("https://api.spotify.com/v1/me/top/artists", {
      headers: {
        Authorization: `Bearer ${user.platforms.spotify.accessToken}`,
      },
    });

    const data = await response.json();

    // Get monthly listeners and followers
    const artistId = user.platforms.spotify.artistId;
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${user.platforms.spotify.accessToken}`,
        },
      }
    );

    const artistData = await artistResponse.json();

    // Store analytics
    await prisma.analytics.create({
      data: {
        userId: session.user.id,
        platform: "spotify",
        date: new Date(),
        metrics: {
          followers: artistData.followers.total,
          streams: data.items.reduce(
            (acc: number, item: any) => acc + item.popularity,
            0
          ),
        },
      },
    });

    return NextResponse.json({
      followers: artistData.followers.total,
      monthlyListeners: artistData.popularity * 1000, // Approximate based on popularity score
      topTracks: data.items.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
