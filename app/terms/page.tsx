import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xl font-bold">CreatorHub</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <div className="prose max-w-none">
            <p className="lead">Last updated: March 20, 2025</p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using CreatorHub&apos;s services, you agree to be
              bound by these Terms of Service and all applicable laws and
              regulations. If you do not agree with any of these terms, you are
              prohibited from using or accessing our services.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access and use
              CreatorHub&apos;s services for personal, non-commercial transitory
              viewing only. This is the grant of a license, not a transfer of
              title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or other proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>

            <h2>3. Subscription Terms</h2>
            <p>
              Subscription fees are billed in advance on a monthly or annual
              basis. You agree to pay all fees associated with your account.
              Fees are non-refundable except as required by law or as explicitly
              stated in these terms.
            </p>

            <h2>4. User Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your use complies with all applicable laws</li>
              <li>Providing accurate account information</li>
              <li>Using the services in a reasonable manner</li>
            </ul>

            <h2>5. Content Guidelines</h2>
            <p>You agree not to use our services to:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Transmit harmful or malicious code</li>
              <li>Interfere with the proper functioning of the service</li>
              <li>Engage in unauthorized data collection</li>
            </ul>

            <h2>6. Termination</h2>
            <p>
              We may terminate or suspend your account and access to our
              services immediately, without prior notice or liability, for any
              reason whatsoever, including without limitation if you breach
              these Terms of Service.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall CreatorHub be liable for any indirect,
              incidental, special, consequential or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses.
            </p>

            <h2>8. Contact Information</h2>
            <p>Questions about the Terms of Service should be sent to us at:</p>
            <p>
              Email: legal@creatorhub.com
              <br />
              Address: 123 Creator Street, Digital City, DC 12345
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
