import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // Verify webhook signature
    const signature = headers().get("x-tiktok-signature");
    if (!verifySignature(await req.clone().text(), signature!)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = await req.json();

    switch (data.event) {
      case "video_posted": {
        const platformFilter: Prisma.JsonObject = {
          tiktok: { userId: data.creator_id },
        };

        const user = await prisma.user.findFirst({
          where: {
            platforms: platformFilter,
          },
        });

        if (user) {
          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "tiktok",
              date: new Date(),
              metrics: {
                views: data.video.views,
                likes: data.video.likes,
                shares: data.video.shares,
              },
            },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "New TikTok Video Posted",
              message: "Your TikTok video has been posted successfully.",
              type: "success",
              data: {
                platform: "tiktok",
                videoId: data.video.id,
              },
            },
          });
        }
        break;
      }

      case "follower_milestone": {
        const platformFilter: Prisma.JsonObject = {
          tiktok: { userId: data.creator_id },
        };

        const user = await prisma.user.findFirst({
          where: {
            platforms: platformFilter,
          },
        });

        if (user) {
          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "tiktok",
              date: new Date(),
              metrics: {
                followers: data.total_followers,
              },
            },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "Follower Milestone!",
              message: `You've reached ${data.total_followers.toLocaleString()} followers on TikTok!`,
              type: "success",
              data: {
                platform: "tiktok",
                followers: data.total_followers,
              },
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("TikTok webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", process.env.TIKTOK_WEBHOOK_SECRET!);
  const expectedSignature = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
