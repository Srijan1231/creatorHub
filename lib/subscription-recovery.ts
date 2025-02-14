import { sendEmail } from "@/lib/email";
import Stripe from "stripe";
import { recordError } from "./monitoring";
import { prisma } from "./prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

interface PaymentFailureDetails {
  userId: string;
  subscriptionId: string;
  invoiceId: string;
  attemptCount: number;
  lastAttempt: Date;
  nextAttempt?: Date;
  errorCode?: string;
  errorMessage?: string;
}

export async function handlePaymentFailure(
  stripeInvoice: Stripe.Invoice,
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      throw new Error(`Subscription not found: ${stripeSubscription.id}`);
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "past_due",
        metadata: {
          ...((subscription.metadata as Record<string, unknown>) || {}),
          paymentFailures:
            ((subscription.metadata as any)?.paymentFailures || 0) + 1,
        },
      },
    });

    // Record payment failure details
    const failureDetails: PaymentFailureDetails = {
      userId: stripeSubscription.metadata.userId,
      subscriptionId: stripeSubscription.id,
      invoiceId: stripeInvoice.id,
      attemptCount: stripeInvoice.attempt_count,
      lastAttempt: new Date(stripeInvoice.created * 1000),
      nextAttempt: stripeInvoice.next_payment_attempt
        ? new Date(stripeInvoice.next_payment_attempt * 1000)
        : undefined,
      errorCode:
        stripeInvoice.payment_intent &&
        typeof stripeInvoice.payment_intent !== "string"
          ? stripeInvoice.payment_intent.last_payment_error?.code
          : undefined,
      errorMessage:
        stripeInvoice.payment_intent &&
        typeof stripeInvoice.payment_intent !== "string"
          ? stripeInvoice.payment_intent.last_payment_error?.message
          : undefined,
    };

    await recordPaymentFailure(failureDetails);

    // Send notification to user
    await notifyUserOfPaymentFailure(failureDetails);
  } catch (error) {
    recordError(
      "/subscription/payment-failure",
      "POST",
      500,
      `Failed to handle payment failure: ${error}`
    );
    throw error;
  }
}

async function recordPaymentFailure(
  details: PaymentFailureDetails
): Promise<void> {
  const income = await prisma.income.findUnique({
    where: { stripeInvoiceId: details.invoiceId },
  });

  if (!income) {
    throw new Error(
      `Income record not found for invoice: ${details.invoiceId}`
    );
  }

  const existingAttempts = (income.paymentAttempts || []) as any[];

  await prisma.income.update({
    where: { id: income.id },
    data: {
      paymentAttempts: [
        ...existingAttempts,
        {
          attemptedAt: details.lastAttempt,
          status: "failed",
          errorCode: details.errorCode,
          errorMessage: details.errorMessage,
        },
      ],
    },
  });
}

async function notifyUserOfPaymentFailure(
  details: PaymentFailureDetails
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: details.userId },
  });

  if (!user?.email) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: details.subscriptionId },
  });

  const templateData = {
    name: user.name || user.email,
    plan: subscription?.plan,
    amount: (subscription?.metadata as any)?.price,
    nextAttempt: details.nextAttempt
      ? new Date(details.nextAttempt).toLocaleDateString()
      : "soon",
    updatePaymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?invoice=${details.invoiceId}`,
  };

  await sendEmail({
    to: user.email,
    subject: "Action Required: Payment Failed",
    template: "payment-failed",
    data: templateData,
  });
}

export async function initiateSubscriptionRecovery(
  subscriptionId: string
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscription || subscription.status !== "past_due") {
      return;
    }

    // Attempt to retry payment
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscriptionId
    );
    const latestInvoice = await stripe.invoices.retrieve(
      stripeSubscription.latest_invoice as string
    );

    if (latestInvoice.status === "open") {
      await stripe.invoices.pay(latestInvoice.id);
    }

    // Update subscription status if payment successful
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "active",
        metadata: {
          ...((subscription.metadata as Record<string, unknown>) || {}),
          lastRecoveryAttempt: new Date(),
        },
      },
    });
  } catch (error) {
    recordError(
      "/subscription/recovery",
      "POST",
      500,
      `Failed to recover subscription: ${error}`
    );
    throw error;
  }
}

export async function checkSubscriptionHealth(): Promise<void> {
  try {
    const pastDueSubscriptions = await prisma.subscription.findMany({
      where: { status: "past_due" },
    });

    for (const subscription of pastDueSubscriptions) {
      const daysPastDue = Math.floor(
        (Date.now() - subscription.currentPeriodEnd.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysPastDue >= 30) {
        // Cancel subscription after 30 days past due
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId!);
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "canceled",
            canceledAt: new Date(),
          },
        });
      } else if (daysPastDue >= 7 && daysPastDue % 7 === 0) {
        // Retry payment weekly
        await initiateSubscriptionRecovery(subscription.stripeSubscriptionId!);
      }
    }
  } catch (error) {
    recordError(
      "/subscription/health-check",
      "POST",
      500,
      `Failed to check subscription health: ${error}`
    );
    throw error;
  }
}
