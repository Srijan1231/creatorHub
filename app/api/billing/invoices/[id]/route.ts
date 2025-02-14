import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the income record (invoice) using Prisma
    const invoice = await prisma.income.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        platform: "stripe",
        type: "subscription",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get the Stripe invoice ID from the details
    const stripeInvoiceId = (invoice.details as any)?.invoiceId;
    if (!stripeInvoiceId) {
      return NextResponse.json(
        { error: "Stripe invoice ID not found" },
        { status: 404 }
      );
    }

    // Get detailed invoice data from Stripe
    const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId);

    return NextResponse.json({
      ...invoice,
      stripeData: {
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
        invoicePdf: stripeInvoice.invoice_pdf,
        lines: stripeInvoice.lines.data,
      },
    });
  } catch (error) {
    console.error("Invoice retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
