import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose max-w-none">
            <p className="lead">Last updated: March 20, 2025</p>

            <h2>1. Introduction</h2>
            <p>
              CreatorHub (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              respects your privacy and is committed to protecting your personal
              data. This privacy policy will inform you about how we look after
              your personal data when you visit our website and tell you about
              your privacy rights and how the law protects you.
            </p>

            <h2>2. Data We Collect</h2>
            <p>We collect and process the following types of personal data:</p>
            <ul>
              <li>Identity Data (name, username)</li>
              <li>Contact Data (email address)</li>
              <li>Technical Data (IP address, browser type)</li>
              <li>Platform Data (connected social media accounts)</li>
              <li>Usage Data (analytics, preferences)</li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>We use your personal data for the following purposes:</p>
            <ul>
              <li>To provide and maintain our services</li>
              <li>To notify you about changes to our services</li>
              <li>To provide customer support</li>
              <li>To gather analytics to improve our services</li>
              <li>To prevent fraud and abuse</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We have implemented appropriate security measures to prevent your
              personal data from being accidentally lost, used, or accessed in
              an unauthorized way. We limit access to your personal data to
              those employees, agents, contractors, and other third parties who
              have a business need to know.
            </p>

            <h2>5. Your Rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection
              laws in relation to your personal data, including the right to:
            </p>
            <ul>
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>

            <h2>6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy
              practices, please contact us at:
            </p>
            <p>
              Email: privacy@creatorhub.com
              <br />
              Address: 123 Creator Street, Digital City, DC 12345
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
