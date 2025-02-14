import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parser for webhook endpoint
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });

        if (!user) break;

        await prisma.subscription.upsert({
          where: { id: subscription.id },
          create: {
            id: subscription.id,
            userId: user.id,
            status: subscription.status,
            plan: (subscription.items.data[0]?.price.id || "").replace(
              /_monthly|_yearly/,
              ""
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          update: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "canceled" },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });

        if (!user) break;

        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        await prisma.income.create({
          data: {
            userId: user.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            platform: "stripe",
            type: "subscription",
            status: "completed",
            date: new Date(invoice.created * 1000),
            details: {
              invoiceId: invoice.id,
              subscriptionId,
              description: invoice.description || "Subscription payment",
            },
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: "past_due" },
        });

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });

        if (!user) break;

        // Create notification for failed payment
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "payment_failed",
            title: "Payment Failed",
            message:
              "Your subscription payment has failed. Please update your payment method.",
            data: {
              invoiceId: invoice.id,
              subscriptionId,
              amount: invoice.amount_due / 100,
              currency: invoice.currency.toUpperCase(),
            },
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
