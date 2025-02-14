import { IS_DEVELOPMENT } from "./constants";

// Mock data for development
export const MOCK_DASHBOARD_DATA = {
  totals: {
    followers: 1250000,
    views: 5000000,
    earnings: 24500,
    platforms: 4,
  },
  platformMetrics: {
    youtube: {
      followers: 500000,
      views: 2500000,
      engagement: 8.5,
      earnings: 12000,
      history: generateHistory(30, {
        followers: { base: 500000, variance: 1000 },
        views: { base: 2500000, variance: 5000 },
      }),
    },
    tiktok: {
      followers: 400000,
      views: 1500000,
      engagement: 12.3,
      earnings: 6000,
      history: generateHistory(30, {
        followers: { base: 400000, variance: 800 },
        views: { base: 1500000, variance: 3000 },
      }),
    },
    spotify: {
      followers: 150000,
      views: 500000,
      engagement: 5.2,
      earnings: 3500,
      history: generateHistory(30, {
        followers: { base: 150000, variance: 300 },
        views: { base: 500000, variance: 1000 },
      }),
    },
    patreon: {
      followers: 200000,
      views: 500000,
      engagement: 15.7,
      earnings: 3000,
      history: generateHistory(30, {
        followers: { base: 200000, variance: 400 },
        views: { base: 500000, variance: 1000 },
      }),
    },
  },
  timeline: generateTimeline(30),
};

export const MOCK_INCOME_DATA = {
  income: generateIncomeData(20),
  summary: {
    total: 24500,
    byPlatform: {
      youtube: 12000,
      tiktok: 6000,
      spotify: 3500,
      patreon: 3000,
    },
    byCategory: {
      ad_revenue: 10000,
      sponsorships: 8000,
      subscriptions: 4000,
      donations: 2500,
    },
  },
};

export const MOCK_NOTIFICATIONS = Array.from({ length: 10 }, (_, i) => ({
  _id: `notification-${i}`,
  title: `Test Notification ${i + 1}`,
  message: `This is a test notification message ${i + 1}`,
  type: ["success", "info", "warning", "error"][i % 4],
  platform: ["youtube", "tiktok", "spotify", "patreon"][i % 4],
  read: i % 3 === 0,
  createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
}));

export const MOCK_SUPPORT_TICKETS = Array.from({ length: 5 }, (_, i) => ({
  _id: `ticket-${i}`,
  subject: `Test Support Ticket ${i + 1}`,
  message: `This is a test support ticket message ${i + 1}`,
  status: ["open", "in_progress", "resolved", "closed"][i % 4],
  priority: ["low", "medium", "high", "urgent"][i % 4],
  category: ["technical", "billing", "account", "feature"][i % 4],
  createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  responses:
    i % 2 === 0
      ? [
          {
            message: `Test response to ticket ${i + 1}`,
            createdBy: "Support Agent",
            createdAt: new Date(
              Date.now() - i * 12 * 60 * 60 * 1000
            ).toISOString(),
          },
        ]
      : [],
}));

// Helper functions
function generateHistory(days: number, metrics: any) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const result: any = {
      date: date.toISOString().split("T")[0],
    };

    Object.entries(metrics).forEach(([key, value]: [string, any]) => {
      result[key] = Math.floor(
        value.base - i * value.variance + Math.random() * value.variance
      );
    });

    return result;
  });
}

function generateTimeline(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split("T")[0],
      youtube: {
        followers: Math.floor(500000 - i * 1000 + Math.random() * 500),
        views: Math.floor(2500000 - i * 5000 + Math.random() * 2500),
      },
      tiktok: {
        followers: Math.floor(400000 - i * 800 + Math.random() * 400),
        views: Math.floor(1500000 - i * 3000 + Math.random() * 1500),
      },
      spotify: {
        followers: Math.floor(150000 - i * 300 + Math.random() * 150),
        views: Math.floor(500000 - i * 1000 + Math.random() * 500),
      },
      patreon: {
        followers: Math.floor(200000 - i * 400 + Math.random() * 200),
        views: Math.floor(500000 - i * 1000 + Math.random() * 500),
      },
    };
  });
}

function generateIncomeData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `income-${i}`,
    platform: ["youtube", "tiktok", "spotify", "patreon"][i % 4],
    amount: Math.floor(Math.random() * 5000) + 1000,
    currency: "USD",
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    description: `Income from ${
      ["ad revenue", "sponsorship", "subscriptions", "donations"][i % 4]
    }`,
    category: ["ad_revenue", "sponsorships", "subscriptions", "donations"][
      i % 4
    ],
  }));
}

// Helper to check if we should use mock data
export function shouldUseMockData() {
  return IS_DEVELOPMENT;
}
