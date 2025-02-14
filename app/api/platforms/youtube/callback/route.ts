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
        new URL("/dashboard/youtube?error=no_code", req.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/platforms/youtube/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("YouTube token error:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/youtube?error=auth_failed", req.url)
      );
    }

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

    if (!channelResponse.ok) {
      console.error("YouTube channel error:", await channelResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/youtube?error=auth_failed", req.url)
      );
    }

    const channelData = await channelResponse.json();
    const channelId = channelData.items[0]?.id;

    if (!channelId) {
      return NextResponse.redirect(
        new URL("/dashboard/youtube?error=no_channel", req.url)
      );
    }

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
          youtube: {
            channelId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/youtube?success=true", req.url)
    );
  } catch (error) {
    console.error("YouTube callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/youtube?error=server_error", req.url)
    );
  }
}
