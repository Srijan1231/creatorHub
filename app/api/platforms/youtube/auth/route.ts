import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/platforms/youtube/callback`;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { platforms: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const youtube = user.platforms?.youtube;
    if (!youtube) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired
    if (new Date() > youtube.tokenExpiry) {
      // Token is expired, try to refresh
      const refreshResponse = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: YOUTUBE_CLIENT_ID!,
            client_secret: YOUTUBE_CLIENT_SECRET!,
            refresh_token: youtube.refreshToken,
            grant_type: "refresh_token",
          }),
        }
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        // Refresh failed, disconnect YouTube
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            platforms: {
              ...user.platforms,
              youtube: undefined,
            },
          },
        });
        return NextResponse.json({ connected: false });
      }

      // Update tokens
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          platforms: {
            ...user.platforms,
            youtube: {
              ...youtube,
              accessToken: refreshData.access_token,
              tokenExpiry: new Date(Date.now() + refreshData.expires_in * 1000),
            },
          },
        },
      });

      return NextResponse.json({
        connected: true,
        channelId: youtube.channelId,
        accessToken: refreshData.access_token,
      });
    }

    return NextResponse.json({
      connected: true,
      channelId: youtube.channelId,
      accessToken: youtube.accessToken,
    });
  } catch (error) {
    console.error("YouTube auth error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
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

    const { code } = await req.json();

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: YOUTUBE_CLIENT_ID!,
        client_secret: YOUTUBE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    // Get channel info
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const channelData = await channelResponse.json();
    const channelId = channelData.items[0]?.id;

    if (!channelId) {
      return NextResponse.json(
        { error: "Could not fetch channel ID" },
        { status: 400 }
      );
    }

    // Update user with YouTube credentials
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { platforms: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        platforms: {
          ...user?.platforms,
          youtube: {
            channelId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("YouTube auth error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
