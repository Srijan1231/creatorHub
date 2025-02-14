import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // Verify webhook signature
    const signature = headers().get("x-hub-signature");
    if (!verifySignature(await req.clone().text(), signature!)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = await req.json();

    switch (data.type) {
      case "video.published": {
        // Find user by YouTube channel ID using JSON filtering
        const platformFilter: Prisma.JsonObject = {
          youtube: { channelId: data.channelId },
        };

        const user = await prisma.user.findFirst({
          where: {
            platforms: platformFilter,
          },
        });

        if (user) {
          // Store analytics
          const metrics: Prisma.JsonObject = {
            views: data.video.views,
            likes: data.video.likes,
            comments: data.video.comments,
          };

          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "youtube",
              date: new Date(),
              metrics,
            },
          });

          // Create notification
          const notificationData: Prisma.JsonObject = {
            platform: "youtube",
            videoId: data.video.id,
          };

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "New YouTube Video Published",
              message: `Your video "${data.video.title}" has been published.`,
              type: "success",
              data: notificationData,
            },
          });
        }
        break;
      }

      case "subscription.new": {
        const platformFilter: Prisma.JsonObject = {
          youtube: { channelId: data.channelId },
        };

        const user = await prisma.user.findFirst({
          where: {
            platforms: platformFilter,
          },
        });

        if (user) {
          const metrics: Prisma.JsonObject = {
            subscribers: data.totalSubscribers,
          };

          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "youtube",
              date: new Date(),
              metrics,
            },
          });

          // Create notification for milestone
          if (data.totalSubscribers % 1000 === 0) {
            const notificationData: Prisma.JsonObject = {
              platform: "youtube",
              subscribers: data.totalSubscribers,
            };

            await prisma.notification.create({
              data: {
                userId: user.id,
                title: "Subscriber Milestone!",
                message: `Congratulations! You've reached ${data.totalSubscribers.toLocaleString()} subscribers!`,
                type: "success",
                data: notificationData,
              },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("YouTube webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha1", process.env.YOUTUBE_WEBHOOK_SECRET!);
  const expectedSignature = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
