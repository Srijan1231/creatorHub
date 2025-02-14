import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { checkPlanLimits } from "@/middleware/plan-limits";
import { prisma } from "@/lib/prisma";

export default withAuth(
  async function middleware(req) {
    // Get user from token
    const token = req.nextauth.token;

    // Public paths that don't require authentication
    const publicPaths = [
      "/",
      "/about",
      "/pricing",
      "/blog",
      "/careers",
      "/privacy",
      "/terms",
      "/security",
      "/auth/signin",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    // Check if the current path is public
    const isPublicPath = publicPaths.some(
      (path) =>
        req.nextUrl.pathname === path ||
        req.nextUrl.pathname.startsWith("/api/auth/") ||
        req.nextUrl.pathname.startsWith("/api/webhooks/")
    );

    // Allow public paths
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Check if user is accessing onboarding
    if (req.nextUrl.pathname === "/onboarding") {
      return NextResponse.next();
    }

    // Redirect to onboarding for new users
    if (
      token &&
      !token.onboardingCompleted &&
      !req.nextUrl.pathname.startsWith("/api/")
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Require authentication for all other routes
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Skip plan checks for certain paths
    const skipPlanCheckPaths = [
      "/dashboard/settings/billing",
      "/api/subscriptions",
      "/api/checkout",
      "/api/webhooks",
    ];

    if (
      !skipPlanCheckPaths.some((path) => req.nextUrl.pathname.startsWith(path))
    ) {
      try {
        // Get user's subscription
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: token.id,
            status: {
              in: ["active", "trialing", "past_due"],
            },
          },
        });

        // Check plan limits
        const planCheckResult = await checkPlanLimits(req, subscription);
        if (planCheckResult) {
          // If headers were set for warnings, copy them to the response
          const warningHeader = planCheckResult.headers?.get(
            "X-Subscription-Warning"
          );
          if (warningHeader) {
            planCheckResult.headers.set(
              "X-Subscription-Warning",
              warningHeader
            );
          }
          return planCheckResult;
        }
      } catch (error) {
        console.error("Error checking plan limits:", error);
        // Continue despite error to avoid blocking user access
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // We handle authorization in the middleware function
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
