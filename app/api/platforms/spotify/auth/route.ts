import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/platforms/spotify/callback`;

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

    const spotify = user.platforms?.spotify;
    if (!spotify) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired
    if (new Date() > spotify.tokenExpiry) {
      // Token is expired, try to refresh
      const refreshResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: spotify.refreshToken,
          }),
        }
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        // Refresh failed, disconnect Spotify
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            platforms: {
              ...user.platforms,
              spotify: undefined,
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
            spotify: {
              ...spotify,
              accessToken: refreshData.access_token,
              tokenExpiry: new Date(Date.now() + refreshData.expires_in * 1000),
            },
          },
        },
      });

      return NextResponse.json({
        connected: true,
        artistId: spotify.artistId,
        accessToken: refreshData.access_token,
      });
    }

    return NextResponse.json({
      connected: true,
      artistId: spotify.artistId,
      accessToken: spotify.accessToken,
    });
  } catch (error) {
    console.error("Spotify auth error:", error);
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
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    // Get artist info
    const artistResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const artistData = await artistResponse.json();
    const artistId = artistData.id;

    if (!artistId) {
      return NextResponse.json(
        { error: "Could not fetch artist ID" },
        { status: 400 }
      );
    }

    // Update user with Spotify credentials
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { platforms: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        platforms: {
          ...user?.platforms,
          spotify: {
            artistId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Spotify auth error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
