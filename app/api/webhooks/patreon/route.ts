import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Verify webhook signature
    const signature = headers().get("x-patreon-signature");
    if (!verifySignature(await req.clone().text(), signature!)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = await req.json();

    switch (data.type) {
      case "pledges:create": {
        const user = await prisma.user.findFirst({
          where: {
            platforms: {
              path: ["patreon", "creatorId"],
              equals: data.data.relationships.creator.data.id,
            },
          },
        });

        if (user) {
          // Record income
          await prisma.income.create({
            data: {
              userId: user.id,
              platform: "patreon",
              amount: data.data.attributes.amount_cents / 100,
              currency: "USD",
              type: "subscription",
              status: "completed",
              date: new Date(),
              details: {
                patronTier: data.data.relationships.tier.data.id,
                transactionId: data.data.id,
                patronName: data.data.attributes.full_name,
              },
            },
          });

          // Update analytics
          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "patreon",
              date: new Date(),
              metrics: {
                patrons: data.included.patrons_count,
                earnings: data.included.earnings_cents / 100,
              },
            },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "New Patron!",
              message: `${data.data.attributes.full_name} has become your patron!`,
              type: "success",
              data: {
                platform: "patreon",
                patronId: data.data.id,
                patronTier: data.data.relationships.tier.data.id,
              },
            },
          });
        }
        break;
      }

      case "pledges:delete": {
        const user = await prisma.user.findFirst({
          where: {
            platforms: {
              path: ["patreon", "creatorId"],
              equals: data.data.relationships.creator.data.id,
            },
          },
        });

        if (user) {
          await prisma.analytics.create({
            data: {
              userId: user.id,
              platform: "patreon",
              date: new Date(),
              metrics: {
                patrons: data.included.patrons_count,
                earnings: data.included.earnings_cents / 100,
              },
            },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: "Patron Left",
              message: "A patron has cancelled their pledge.",
              type: "info",
              data: {
                platform: "patreon",
                patronId: data.data.id,
              },
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Patreon webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("md5", process.env.PATREON_WEBHOOK_SECRET!);
  const expectedSignature = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
