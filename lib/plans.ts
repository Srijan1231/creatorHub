import { Plan } from "@/types/plans";

export const PLANS: Record<string, Plan> = {
  starter: {
    name: "Starter",
    price: 49,
    trialDays: 0,
    features: {
      platformConnections: 1,
      dataHistory: 30,
      apiAccess: "basic",
      customReports: false,
      revenueForecasting: false,
      automatedTracking: true,
      platformInsights: false,
    },
  },
  core: {
    name: "Core",
    price: 150,
    trialDays: 14, // 14-day free trial only on Core plan
    popular: true, // Mark as most popular
    features: {
      platformConnections: 3,
      dataHistory: 90,
      apiAccess: "basic",
      customReports: true,
      revenueForecasting: true,
      automatedTracking: true,
      platformInsights: true,
    },
  },
  pro: {
    name: "Pro",
    price: 250,
    trialDays: 0,
    features: {
      platformConnections: 5,
      dataHistory: Infinity,
      apiAccess: "advanced",
      customReports: true,
      revenueForecasting: true,
      automatedTracking: true,
      platformInsights: true,
      customIntegrations: true,
      dedicatedManager: true,
      whitelabelReports: true,
      aiInsights: true,
      revenueOptimization: true,
    },
  },
};

export function getPlanLimits(plan: string | undefined): Plan["features"] {
  return PLANS[plan || "starter"]?.features || PLANS.starter.features;
}
