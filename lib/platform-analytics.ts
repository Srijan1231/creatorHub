import { getValidToken } from "./platform-tokens";
import { prisma } from "./prisma";

interface AnalyticsData {
  followers: number;
  views: number;
  engagement: number;
  earnings: number;
  history: Array<{
    date: string;
    followers: number;
    views: number;
  }>;
}

/**
 * Fetch YouTube analytics
 */
export async function getYouTubeAnalytics(
  userId: string
): Promise<AnalyticsData> {
  try {
    const accessToken = await getValidToken(userId, "youtube");

    // Fetch channel statistics
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const channelData = await channelResponse.json();
    const stats = channelData.items[0].statistics;

    // Calculate engagement rate
    const engagement =
      ((parseInt(stats.likeCount) + parseInt(stats.commentCount)) /
        parseInt(stats.viewCount)) *
      100;

    // Get historical data from our database
    const historicalData = await prisma.analytics.findMany({
      where: {
        userId,
        platform: "youtube",
      },
      orderBy: { date: "asc" },
      take: 30,
    });

    return {
      followers: parseInt(stats.subscriberCount),
      views: parseInt(stats.viewCount),
      engagement,
      earnings: await calculatePlatformEarnings(userId, "youtube"),
      history: historicalData.map((record) => ({
        date: record.date.toISOString().split("T")[0],
        followers: (record.metrics as any).followers || 0,
        views: (record.metrics as any).views || 0,
      })),
    };
  } catch (error) {
    console.error("Error fetching YouTube analytics:", error);
    throw error;
  }
}

/**
 * Fetch TikTok analytics
 */
export async function getTikTokAnalytics(
  userId: string
): Promise<AnalyticsData> {
  try {
    const accessToken = await getValidToken(userId, "tiktok");

    // Fetch creator statistics
    const statsResponse = await fetch(
      "https://open-api.tiktok.com/v2/user/info/",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const statsData = await statsResponse.json();
    const stats = statsData.data;

    // Calculate engagement rate
    const engagement =
      ((stats.like_count + stats.comment_count) / stats.video_view_count) * 100;

    // Get historical data
    const historicalData = await prisma.analytics.findMany({
      where: {
        userId,
        platform: "tiktok",
      },
      orderBy: { date: "asc" },
      take: 30,
    });

    return {
      followers: stats.follower_count,
      views: stats.video_view_count,
      engagement,
      earnings: await calculatePlatformEarnings(userId, "tiktok"),
      history: historicalData.map((record) => ({
        date: record.date.toISOString().split("T")[0],
        followers: (record.metrics as any).followers || 0,
        views: (record.metrics as any).views || 0,
      })),
    };
  } catch (error) {
    console.error("Error fetching TikTok analytics:", error);
    throw error;
  }
}

/**
 * Fetch Spotify analytics
 */
export async function getSpotifyAnalytics(
  userId: string
): Promise<AnalyticsData> {
  try {
    const accessToken = await getValidToken(userId, "spotify");

    // Fetch artist statistics
    const statsResponse = await fetch("https://api.spotify.com/v1/me/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const statsData = await statsResponse.json();

    // Get historical data
    const historicalData = await prisma.analytics.findMany({
      where: {
        userId,
        platform: "spotify",
      },
      orderBy: { date: "asc" },
      take: 30,
    });

    return {
      followers: statsData.followers.total,
      views: statsData.monthly_listeners,
      engagement: 0, // Spotify doesn't provide engagement metrics
      earnings: await calculatePlatformEarnings(userId, "spotify"),
      history: historicalData.map((record) => ({
        date: record.date.toISOString().split("T")[0],
        followers: (record.metrics as any).followers || 0,
        views: (record.metrics as any).streams || 0,
      })),
    };
  } catch (error) {
    console.error("Error fetching Spotify analytics:", error);
    throw error;
  }
}

/**
 * Fetch Patreon analytics
 */
export async function getPatreonAnalytics(
  userId: string
): Promise<AnalyticsData> {
  try {
    const accessToken = await getValidToken(userId, "patreon");

    // Fetch campaign statistics
    const campaignResponse = await fetch(
      "https://www.patreon.com/api/oauth2/v2/campaigns",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const campaignData = await campaignResponse.json();
    const campaign = campaignData.data[0];

    // Get historical data
    const historicalData = await prisma.analytics.findMany({
      where: {
        userId,
        platform: "patreon",
      },
      orderBy: { date: "asc" },
      take: 30,
    });

    return {
      followers: campaign.attributes.patron_count,
      views: campaign.attributes.creation_count,
      engagement:
        (campaign.attributes.patron_count /
          campaign.attributes.following_count) *
        100,
      earnings: await calculatePlatformEarnings(userId, "patreon"),
      history: historicalData.map((record) => ({
        date: record.date.toISOString().split("T")[0],
        followers: (record.metrics as any).patrons || 0,
        views: 0,
      })),
    };
  } catch (error) {
    console.error("Error fetching Patreon analytics:", error);
    throw error;
  }
}

/**
 * Calculate platform earnings
 */
async function calculatePlatformEarnings(
  userId: string,
  platform: string
): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const earnings = await prisma.income.aggregate({
    where: {
      userId,
      platform,
      date: { gte: thirtyDaysAgo },
    },
    _sum: {
      amount: true,
    },
  });

  return earnings._sum.amount || 0;
}
