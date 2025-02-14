import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard/spotify?error=no_code", req.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/platforms/spotify/callback`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("Spotify token error:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/spotify?error=auth_failed", req.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get artist info
    const artistResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!artistResponse.ok) {
      console.error("Spotify artist error:", await artistResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/spotify?error=auth_failed", req.url)
      );
    }

    const artistData = await artistResponse.json();

    // Get current user data to preserve other platform connections
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { platforms: true },
    });

    // Store the tokens in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        platforms: {
          ...currentUser?.platforms,
          spotify: {
            artistId: artistData.id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/spotify?success=true", req.url)
    );
  } catch (error) {
    console.error("Spotify callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/spotify?error=server_error", req.url)
    );
  }
}
