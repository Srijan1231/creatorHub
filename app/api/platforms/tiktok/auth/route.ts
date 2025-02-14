import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`;

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

    const tiktok = user.platforms?.tiktok;
    if (!tiktok) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired
    if (new Date() > tiktok.tokenExpiry) {
      // Token is expired, try to refresh
      const refreshResponse = await fetch(
        "https://open-api.tiktok.com/oauth/refresh_token/",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_key: TIKTOK_CLIENT_KEY!,
            client_secret: TIKTOK_CLIENT_SECRET!,
            refresh_token: tiktok.refreshToken,
            grant_type: "refresh_token",
          }),
        }
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        // Refresh failed, disconnect TikTok
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            platforms: {
              ...user.platforms,
              tiktok: undefined,
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
            tiktok: {
              ...tiktok,
              accessToken: refreshData.access_token,
              tokenExpiry: new Date(Date.now() + refreshData.expires_in * 1000),
            },
          },
        },
      });

      return NextResponse.json({
        connected: true,
        userId: tiktok.userId,
        accessToken: refreshData.access_token,
      });
    }

    return NextResponse.json({
      connected: true,
      userId: tiktok.userId,
      accessToken: tiktok.accessToken,
    });
  } catch (error) {
    console.error("TikTok auth error:", error);
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

    const tokenResponse = await fetch(
      "https://open-api.tiktok.com/oauth/access_token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_key: TIKTOK_CLIENT_KEY!,
          client_secret: TIKTOK_CLIENT_SECRET!,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch("https://open-api.tiktok.com/user/info/", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    const userId = userData.data.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Could not fetch user ID" },
        { status: 400 }
      );
    }

    // Update user with TikTok credentials
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { platforms: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        platforms: {
          ...user?.platforms,
          tiktok: {
            userId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("TikTok auth error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
