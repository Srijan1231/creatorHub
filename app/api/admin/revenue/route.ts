import { NextResponse } from "next/server";
import { requireAdmin } from "@/middleware/admin";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    // Get date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get subscription and income data in parallel
    const [subscriptions, income] = await Promise.all([
      prisma.subscription.findMany({
        where: {
          createdAt: { gte: startDate },
          status: "active",
        },
        select: {
          id: true,
          plan: true,
          status: true,
          currentPeriodEnd: true,
        },
      }),
      prisma.income.findMany({
        where: {
          date: { gte: startDate },
          platform: "stripe",
          type: "subscription",
          status: "completed",
        },
        select: {
          amount: true,
          currency: true,
          platform: true,
          type: true,
          details: true,
        },
      }),
    ]);

    // Calculate metrics
    const metrics = {
      totalRevenue: income.reduce((sum, record) => sum + record.amount, 0),
      activeSubscriptions: subscriptions.length,
      revenueByPlan: income.reduce((acc: Record<string, number>, record) => {
        const plan = (record.details as any)?.plan || "unknown";
        acc[plan] = (acc[plan] || 0) + record.amount;
        return acc;
      }, {}),
      conversionRate: 0, // Will be calculated if needed
    };

    // Get Stripe data
    const charges = await stripe.charges.list({
      created: { gte: Math.floor(startDate.getTime() / 1000) },
      limit: 100,
    });

    const stripeMetrics = {
      successfulPayments: charges.data.filter((c) => c.status === "succeeded")
        .length,
      failedPayments: charges.data.filter((c) => c.status === "failed").length,
      refunds: charges.data.filter((c) => c.refunded).length,
      disputes: charges.data.filter((c) => c.disputed).length,
    };

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (req as any).adminId, // Set by requireAdmin middleware
        action: "VIEW_REVENUE",
        method: "GET",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          period,
          metrics,
          stripeMetrics,
        },
      },
    });

    return NextResponse.json({
      metrics,
      stripeMetrics,
      period,
    });
  } catch (error) {
    console.error("Revenue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
