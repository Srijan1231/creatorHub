import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update settings and create welcome notification in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          settings: {
            ...user.settings,
            onboardingCompleted: true,
          },
        },
      }),
      prisma.notification.create({
        data: {
          userId: session.user.id,
          title: "Welcome to CreatorHub!",
          message:
            "Your account is now set up. Start tracking your creator journey across all platforms.",
          type: "success",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
