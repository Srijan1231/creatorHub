export interface Plan {
  name: string;
  price: number;
  trialDays: number;
  popular?: boolean;
  features: {
    platformConnections: number;
    dataHistory: number;
    apiAccess: "basic" | "advanced";
    customReports: boolean;
    revenueForecasting: boolean;
    automatedTracking: boolean;
    platformInsights: boolean;
    customIntegrations?: boolean;
    dedicatedManager?: boolean;
    whitelabelReports?: boolean;
    aiInsights?: boolean;
    revenueOptimization?: boolean;
  };
}

export interface UserSubscription {
  plan: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
