import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_INVOICE_WEBHOOK_SECRET!;

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

    switch (event.type) {
      case "invoice.created": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceCreated(invoice);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "invoice.payment_action_required": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentActionRequired(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Invoice webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleInvoiceCreated(stripeInvoice: Stripe.Invoice) {
  // Find the subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: stripeInvoice.subscription as string,
    },
  });

  if (!subscription) return;

  // Create income record for the invoice
  const details: Prisma.JsonObject = {
    invoiceId: stripeInvoice.id,
    subscriptionId: subscription.id,
    billingReason: stripeInvoice.billing_reason,
    periodStart: new Date(stripeInvoice.period_start * 1000).toISOString(),
    periodEnd: new Date(stripeInvoice.period_end * 1000).toISOString(),
  };

  await prisma.income.create({
    data: {
      userId: subscription.userId,
      platform: "stripe",
      type: "subscription",
      amount: stripeInvoice.amount_due / 100,
      currency: stripeInvoice.currency.toUpperCase(),
      status: "pending",
      date: new Date(stripeInvoice.created * 1000),
      details,
    },
  });
}

async function handleInvoicePaid(stripeInvoice: Stripe.Invoice) {
  const income = await prisma.income.findFirst({
    where: {
      AND: [
        { platform: "stripe" },
        { type: "subscription" },
        { details: { equals: { invoiceId: stripeInvoice.id } } },
      ],
    },
  });

  if (!income) return;

  const updatedDetails: Prisma.JsonObject = {
    ...(income.details as Prisma.JsonObject),
    paidAt: new Date().toISOString(),
  };

  await prisma.income.update({
    where: { id: income.id },
    data: {
      status: "completed",
      details: updatedDetails,
    },
  });

  const notificationData: Prisma.JsonObject = {
    platform: "stripe",
    invoiceId: stripeInvoice.id,
    amount: stripeInvoice.amount_paid / 100,
    currency: stripeInvoice.currency.toUpperCase(),
  };

  await prisma.notification.create({
    data: {
      userId: income.userId,
      title: "Payment Successful",
      message: `Your payment of ${(
        stripeInvoice.amount_paid / 100
      ).toLocaleString()} ${stripeInvoice.currency.toUpperCase()} has been processed successfully.`,
      type: "success",
      data: notificationData,
    },
  });
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  const income = await prisma.income.findFirst({
    where: {
      AND: [
        { platform: "stripe" },
        { type: "subscription" },
        { details: { equals: { invoiceId: stripeInvoice.id } } },
      ],
    },
  });

  if (!income) return;

  await prisma.income.update({
    where: { id: income.id },
    data: {
      status: "failed",
    },
  });

  const notificationData: Prisma.JsonObject = {
    platform: "stripe",
    invoiceId: stripeInvoice.id,
    amount: stripeInvoice.amount_due / 100,
    currency: stripeInvoice.currency.toUpperCase(),
  };

  await prisma.notification.create({
    data: {
      userId: income.userId,
      title: "Payment Failed",
      message:
        "Your latest payment attempt has failed. Please update your payment method.",
      type: "error",
      data: notificationData,
    },
  });
}

async function handlePaymentActionRequired(stripeInvoice: Stripe.Invoice) {
  const income = await prisma.income.findFirst({
    where: {
      AND: [
        { platform: "stripe" },
        { type: "subscription" },
        { details: { equals: { invoiceId: stripeInvoice.id } } },
      ],
    },
  });

  if (!income) return;

  const notificationData: Prisma.JsonObject = {
    platform: "stripe",
    invoiceId: stripeInvoice.id,
    amount: stripeInvoice.amount_due / 100,
    currency: stripeInvoice.currency.toUpperCase(),
  };

  await prisma.notification.create({
    data: {
      userId: income.userId,
      title: "Action Required",
      message: "Additional authentication is required to process your payment.",
      type: "warning",
      data: notificationData,
    },
  });
}
