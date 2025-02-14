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
        new URL("/dashboard/patreon?error=no_code", req.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://www.patreon.com/api/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: process.env.PATREON_CLIENT_ID!,
          client_secret: process.env.PATREON_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/platforms/patreon/callback`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("Patreon token error:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/patreon?error=auth_failed", req.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get creator ID
    const creatorResponse = await fetch(
      "https://www.patreon.com/api/oauth2/v2/identity",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!creatorResponse.ok) {
      console.error("Patreon creator error:", await creatorResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/patreon?error=auth_failed", req.url)
      );
    }

    const creatorData = await creatorResponse.json();

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
          patreon: {
            creatorId: creatorData.data.id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/patreon?success=true", req.url)
    );
  } catch (error) {
    console.error("Patreon callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/patreon?error=server_error", req.url)
    );
  }
}
