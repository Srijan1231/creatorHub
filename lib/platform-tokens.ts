import { prisma } from "./prisma";
import { Platform } from "@prisma/client";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

type PlatformType = keyof Platform;

/**
 * Check if a token needs refresh
 */
function isTokenExpired(expiryDate: Date): boolean {
  // Add 5 minute buffer
  return new Date(expiryDate.getTime() - 5 * 60 * 1000) <= new Date();
}

/**
 * Refresh YouTube token
 */
async function refreshYouTubeToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh YouTube token");
  }

  return response.json();
}

/**
 * Refresh TikTok token
 */
async function refreshTikTokToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch(
    "https://open-api.tiktok.com/oauth/refresh_token/",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to refresh TikTok token");
  }

  return response.json();
}

/**
 * Refresh Spotify token
 */
async function refreshSpotifyToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Spotify token");
  }

  return response.json();
}

/**
 * Refresh Patreon token
 */
async function refreshPatreonToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.PATREON_CLIENT_ID!,
      client_secret: process.env.PATREON_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Patreon token");
  }

  return response.json();
}

/**
 * Get valid access token for a platform
 */
export async function getValidToken(
  userId: string,
  platform: PlatformType
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platforms: true },
  });

  if (!user?.platforms?.[platform]) {
    throw new Error(`Platform ${platform} not connected`);
  }

  const platformData = user.platforms[platform];

  if (!platformData || !("accessToken" in platformData)) {
    throw new Error(`Invalid platform data for ${platform}`);
  }

  if (
    !platformData.tokenExpiry ||
    isTokenExpired(new Date(platformData.tokenExpiry))
  ) {
    if (!platformData.refreshToken) {
      throw new Error(`No refresh token available for ${platform}`);
    }

    try {
      let tokenData: TokenResponse;

      switch (platform) {
        case "youtube":
          tokenData = await refreshYouTubeToken(platformData.refreshToken);
          break;
        case "tiktok":
          tokenData = await refreshTikTokToken(platformData.refreshToken);
          break;
        case "spotify":
          tokenData = await refreshSpotifyToken(platformData.refreshToken);
          break;
        case "patreon":
          tokenData = await refreshPatreonToken(platformData.refreshToken);
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      // Update tokens in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          platforms: {
            ...user.platforms,
            [platform]: {
              ...platformData,
              accessToken: tokenData.access_token,
              refreshToken:
                tokenData.refresh_token || platformData.refreshToken,
              tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
            },
          },
        },
      });

      return tokenData.access_token;
    } catch (error) {
      console.error(`Failed to refresh ${platform} token:`, error);
      throw error;
    }
  }

  return platformData.accessToken;
}
