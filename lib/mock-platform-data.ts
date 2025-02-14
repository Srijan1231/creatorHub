import { shouldUseMockData } from "./mock-data";

export function getMockYouTubeStats() {
  return {
    items: [
      {
        statistics: {
          subscriberCount: "500000",
          viewCount: "2500000",
          videoCount: "150",
          likeCount: "75000",
          commentCount: "25000",
        },
      },
    ],
  };
}

export function getMockTikTokStats() {
  return {
    data: {
      follower_count: 400000,
      following_count: 1000,
      like_count: 2000000,
      video_count: 200,
      video_view_count: 1500000,
      comment_count: 50000,
    },
  };
}

export function getMockSpotifyStats() {
  return {
    followers: {
      total: 150000,
    },
    monthly_listeners: 500000,
    popularity: 75,
    tracks: Array.from({ length: 5 }, (_, i) => ({
      name: `Track ${i + 1}`,
      popularity: Math.floor(Math.random() * 30) + 70,
    })),
  };
}

export function getMockPatreonStats() {
  return {
    data: [
      {
        attributes: {
          creation_name: "Creator Content",
          patron_count: 2000,
          creation_count: 50,
          following_count: 10000,
        },
      },
    ],
    included: Array.from({ length: 3 }, (_, i) => ({
      type: "tier",
      id: `tier-${i + 1}`,
      attributes: {
        title: `Tier ${i + 1}`,
        description: `Description for tier ${i + 1}`,
        amount_cents: (i + 1) * 500,
        patron_count: Math.floor(Math.random() * 500) + 100,
        image_url: null,
      },
    })),
  };
}

export function getMockPatrons() {
  return {
    data: Array.from({ length: 5 }, (_, i) => ({
      id: `patron-${i}`,
      attributes: {
        full_name: `Patron ${i + 1}`,
        patron_status: "active_patron",
        lifetime_support_cents: Math.floor(Math.random() * 50000) + 10000,
        currently_entitled_amount_cents: Math.floor(Math.random() * 1000) + 500,
        pledge_relationship_start: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        next_charge_date: new Date(
          Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    })),
  };
}

// Helper function to simulate API delays in development
export async function simulateApiDelay() {
  if (shouldUseMockData()) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 500 + 200)
    );
  }
}
