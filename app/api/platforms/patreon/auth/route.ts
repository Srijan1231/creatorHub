import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID;
const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/platforms/patreon/callback`;

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

    const patreon = user.platforms?.patreon;
    if (!patreon) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired
    if (new Date() > patreon.tokenExpiry) {
      // Token is expired, try to refresh
      const refreshResponse = await fetch(
        "https://www.patreon.com/api/oauth2/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: PATREON_CLIENT_ID!,
            client_secret: PATREON_CLIENT_SECRET!,
            refresh_token: patreon.refreshToken,
            grant_type: "refresh_token",
          }),
        }
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        // Refresh failed, disconnect Patreon
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            platforms: {
              ...user.platforms,
              patreon: undefined,
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
            patreon: {
              ...patreon,
              accessToken: refreshData.access_token,
              tokenExpiry: new Date(Date.now() + refreshData.expires_in * 1000),
            },
          },
        },
      });

      return NextResponse.json({
        connected: true,
        creatorId: patreon.creatorId,
        accessToken: refreshData.access_token,
      });
    }

    return NextResponse.json({
      connected: true,
      creatorId: patreon.creatorId,
      accessToken: patreon.accessToken,
    });
  } catch (error) {
    console.error("Patreon auth error:", error);
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
      "https://www.patreon.com/api/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: PATREON_CLIENT_ID!,
          client_secret: PATREON_CLIENT_SECRET!,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    // Get creator info
    const creatorResponse = await fetch(
      "https://www.patreon.com/api/oauth2/v2/identity",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const creatorData = await creatorResponse.json();
    const creatorId = creatorData.data.id;

    if (!creatorId) {
      return NextResponse.json(
        { error: "Could not fetch creator ID" },
        { status: 400 }
      );
    }

    // Update user with Patreon credentials
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { platforms: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        platforms: {
          ...user?.platforms,
          patreon: {
            creatorId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Patreon auth error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
