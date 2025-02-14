import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_REFUND_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      await handleRefund(charge);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Refund webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleRefund(charge: Stripe.Charge) {
  const invoiceFilter: Prisma.JsonObject = {
    invoiceId: charge.invoice?.toString() || null,
  };

  const income = await prisma.income.findFirst({
    where: {
      AND: [
        { platform: "stripe" },
        { type: "subscription" },
        { details: invoiceFilter },
      ],
    },
  });

  if (!income) return;

  const updatedDetails: Prisma.JsonObject = {
    ...(income.details as Prisma.JsonObject),
    refundedAt: new Date().toISOString(),
    refundAmount: charge.amount_refunded / 100,
  };

  await prisma.income.update({
    where: { id: income.id },
    data: {
      status: "refunded",
      details: updatedDetails,
    },
  });

  const notificationData: Prisma.JsonObject = {
    platform: "stripe",
    invoiceId: charge.invoice?.toString() || null,
    refundAmount: charge.amount_refunded / 100,
    currency: charge.currency.toUpperCase(),
  };

  await prisma.notification.create({
    data: {
      userId: income.userId,
      title: "Refund Processed",
      message: `A refund of ${(
        charge.amount_refunded / 100
      ).toLocaleString()} ${charge.currency.toUpperCase()} has been processed.`,
      type: "info",
      data: notificationData,
    },
  });
}
