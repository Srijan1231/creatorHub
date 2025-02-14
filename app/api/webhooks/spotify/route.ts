import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Verify webhook signature
    const signature = headers().get("spotify-signature");
    if (!verifySignature(await req.clone().text(), signature!)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = await req.json();

    switch (data.type) {
      case "track.played": {
        const user = await prisma.user.findFirst({
          where: {
            platforms: {
              path: ["spotify", "artistId"],
              equals: data.artist_id,
            },
          },
        });

        if (user) {
          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "spotify",
              date: new Date(),
              metrics: {
                streams: data.total_streams,
              },
            },
          });

          // Notify on stream milestones
          if (data.total_streams % 100000 === 0) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: "Streaming Milestone!",
                message: `Your music has reached ${data.total_streams.toLocaleString()} total streams!`,
                type: "success",
                data: {
                  platform: "spotify",
                  streams: data.total_streams,
                },
              },
            });
          }
        }
        break;
      }

      case "follower.milestone": {
        const user = await prisma.user.findFirst({
          where: {
            platforms: {
              path: ["spotify", "artistId"],
              equals: data.artist_id,
            },
          },
        });

        if (user) {
          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "spotify",
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
              message: `You've reached ${data.total_followers.toLocaleString()} followers on Spotify!`,
              type: "success",
              data: {
                platform: "spotify",
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
    console.error("Spotify webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", process.env.SPOTIFY_WEBHOOK_SECRET!);
  const expectedSignature = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
