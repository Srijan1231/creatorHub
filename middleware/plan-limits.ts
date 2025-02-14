import { NextResponse } from "next/server";
import { getPlanLimits } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function checkPlanLimits(req: Request, subscription: any) {
  // First check subscription status
  if (subscription?.status === "past_due") {
    return new NextResponse(
      JSON.stringify({
        error: "Your subscription payment is past due",
        code: "PAYMENT_REQUIRED",
      }),
      { status: 402 }
    );
  }

  if (subscription?.status === "canceled") {
    return new NextResponse(
      JSON.stringify({
        error: "Your subscription has been canceled",
        code: "SUBSCRIPTION_REQUIRED",
      }),
      { status: 403 }
    );
  }

  // Check trial status
  if (subscription?.status === "trialing") {
    const trialEnd = new Date(subscription.trialEnd);
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft <= 3) {
      // Add warning header for frontend to show trial expiry reminder
      const headers = new Headers();
      headers.set(
        "X-Subscription-Warning",
        JSON.stringify({
          type: "TRIAL_ENDING",
          daysLeft,
        })
      );
    }
  }

  const planLimits = getPlanLimits(subscription?.plan);

  // Check platform connection limits
  if (req.url.includes("/api/platforms") && req.method === "POST") {
    const connectedPlatforms = await getConnectedPlatformsCount(req);
    if (connectedPlatforms >= planLimits.platformConnections) {
      return new NextResponse(
        JSON.stringify({
          error: "Platform connection limit reached for your plan",
          code: "LIMIT_REACHED",
          upgrade: true,
        }),
        { status: 403 }
      );
    }
  }

  // Check data history limits
  if (req.url.includes("/api/analytics") || req.url.includes("/api/income")) {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");

    if (startDate) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysAgo > planLimits.dataHistory) {
        return new NextResponse(
          JSON.stringify({
            error: "Data history limit reached for your plan",
            code: "LIMIT_REACHED",
            upgrade: true,
          }),
          { status: 403 }
        );
      }
    }
  }

  // Check API access
  if (req.url.includes("/api/v1") && planLimits.apiAccess === "basic") {
    const endpoint = new URL(req.url).pathname;
    const restrictedEndpoints = [
      "/api/v1/advanced",
      "/api/v1/custom",
      "/api/v1/ai",
    ];

    if (restrictedEndpoints.some((e) => endpoint.startsWith(e))) {
      return new NextResponse(
        JSON.stringify({
          error: "This API endpoint requires a Pro plan",
          code: "FEATURE_RESTRICTED",
          upgrade: true,
        }),
        { status: 403 }
      );
    }
  }

  // Check if subscription is about to expire
  if (subscription?.cancelAtPeriodEnd) {
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const daysLeft = Math.ceil(
      (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft <= 3) {
      // Add warning header for frontend to show expiry reminder
      const headers = new Headers();
      headers.set(
        "X-Subscription-Warning",
        JSON.stringify({
          type: "SUBSCRIPTION_ENDING",
          daysLeft,
        })
      );
    }
  }

  return null;
}

async function getConnectedPlatformsCount(req: Request): Promise<number> {
  try {
    const userId = req.headers.get("user-id");
    const user = await prisma.user.findUnique({
      where: { id: userId! },
      select: { platforms: true },
    });

    if (!user?.platforms) return 0;

    return Object.keys(user.platforms).filter(
      (platform) => (user.platforms as any)[platform]?.accessToken
    ).length;
  } catch (error) {
    console.error("Error getting connected platforms count:", error);
    return 0;
  }
}
