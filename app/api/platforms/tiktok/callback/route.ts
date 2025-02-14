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
        new URL("/dashboard/tiktok?error=no_code", req.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://open-api.tiktok.com/oauth/access_token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("TikTok token error:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/tiktok?error=auth_failed", req.url)
      );
    }

    const tokenData = await tokenResponse.json();

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
          tiktok: {
            userId: tokenData.open_id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/tiktok?success=true", req.url)
    );
  } catch (error) {
    console.error("TikTok callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/tiktok?error=server_error", req.url)
    );
  }
}
