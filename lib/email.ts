import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { VerificationEmail } from "@/emails/verification-email";
import { ResetPasswordEmail } from "@/emails/reset-password-email";
import { rateLimit } from "./rate-limit";
import { randomBytes } from "crypto";

// Rate limiter for email sending
const emailLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 3, // 3 emails per minute per recipient
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
}

// Email templates
const emailTemplates = {
  "payment-failed": (data: Record<string, any>) => ({
    subject: "Payment Failed for Your Subscription",
    body: `
      <h1>Payment Failed for Your Subscription</h1>
      <p>Hello ${data.name},</p>
      <p>We were unable to process your payment for the ${data.plan} plan (${data.amount}).</p>
      <p>We will attempt to charge your card again ${data.nextAttempt}.</p>
      <p>To avoid any service interruption, please update your payment information:</p>
      <a href="${data.updatePaymentLink}">Update Payment Method</a>
    `,
  }),
  "subscription-canceled": (data: Record<string, any>) => ({
    subject: "Subscription Canceled",
    body: `
      <h1>Subscription Canceled</h1>
      <p>Hello ${data.name},</p>
      <p>Your ${data.plan} subscription has been canceled due to payment failure.</p>
      <p>To restore your access, please reactivate your subscription:</p>
      <a href="${data.reactivateLink}">Reactivate Subscription</a>
    `,
  }),
  "trial-ending": (data: Record<string, any>) => ({
    subject: "Trial Period Ending Soon",
    body: `
      <h1>Trial Period Ending Soon</h1>
      <p>Hello ${data.name},</p>
      <p>Your trial period for the ${data.plan} plan will end in ${data.daysLeft} days.</p>
      <p>To continue using our services, please update your payment information:</p>
      <a href="${data.updatePaymentLink}">Add Payment Method</a>
    `,
  }),
};

/**
 * Send an email with rate limiting
 */
export async function sendEmail({
  to,
  subject,
  template,
  data = {},
}: SendEmailOptions): Promise<void> {
  try {
    // Apply rate limiting
    const mockRequest = new Request(`http://localhost/email/${to}`);
    await emailLimiter.check(mockRequest);

    // Get template function
    const templateFn = emailTemplates[template as keyof typeof emailTemplates];
    if (!templateFn) {
      throw new Error(`Email template '${template}' not found`);
    }

    // Generate HTML content
    const { body } = templateFn(data);

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: body,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Rate limit exceeded") {
      throw new Error("Too many email requests");
    }
    throw error;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const html = render(
    VerificationEmail({
      verificationUrl,
      email,
    })
  );

  await sendEmail({
    to: email,
    subject: "Verify your email address",
    template: "verification-email",
    data: {
      verificationUrl,
      email,
    },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const html = render(
    ResetPasswordEmail({
      resetUrl,
      email,
    })
  );

  await sendEmail({
    to: email,
    subject: "Reset your password",
    template: "reset-password-email",
    data: {
      resetUrl,
      email,
    },
  });
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length / 2).toString("hex");
}

// Verify email configuration on startup
if (process.env.NODE_ENV === "production") {
  transporter
    .verify()
    .then(() => {
      console.log("Email service is ready");
    })
    .catch((error) => {
      console.error("Email service configuration error:", error);
    });
}
