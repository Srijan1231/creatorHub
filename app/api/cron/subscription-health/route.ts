import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import cronManager from "@/lib/cron-manager";
import { checkSubscriptionHealth } from "@/lib/subscription-recovery";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Verify cron secret to ensure only authorized calls
function isAuthorizedCronRequest(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(req: Request) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkSubscriptionHealth();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Subscription health check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Instead of exposing an HTTP endpoint, we'll expose a status endpoint
export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active subscriptions with user data
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ["active", "trialing"] },
      },
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        userId: true,
      },
    });

    // Get user data separately to avoid type issues
    const userIds = subscriptions.map((sub) => sub.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    // Create a map of users for easy lookup
    const userMap = new Map(users.map((user) => [user.id, user]));

    const results = {
      checked: subscriptions.length,
      updated: 0,
      errors: 0,
    };

    // Check each subscription
    for (const sub of subscriptions) {
      try {
        const user = userMap.get(sub.userId);
        if (!user?.stripeCustomerId) continue;

        // Get Stripe subscription status
        const stripeSubscription = await stripe.subscriptions.retrieve(sub.id);

        // Update if status has changed
        if (stripeSubscription.status !== sub.status) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: stripeSubscription.status,
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            },
          });
          results.updated++;
        }
      } catch (error) {
        console.error(`Error checking subscription ${sub.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Subscription health check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Initialize cron manager if it hasn't been initialized
// This will be called when the route module is loaded
if (process.env.NODE_ENV === "production") {
  cronManager.initialize();
}
