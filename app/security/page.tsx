import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Shield, Lock, Key } from "lucide-react";

export default function SecurityPage() {
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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Security at CreatorHub
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your security is our top priority. Learn about how we protect your data and maintain trust.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Data Protection</h3>
              <p className="text-muted-foreground">
                All data is encrypted at rest and in transit using industry-standard encryption protocols.
              </p>
            </Card>
            <Card className="p-6">
              <Lock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Access Control</h3>
              <p className="text-muted-foreground">
                Robust authentication and authorization systems ensure only authorized access to your data.
              </p>
            </Card>
            <Card className="p-6">
              <Key className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Infrastructure</h3>
              <p className="text-muted-foreground">
                Our infrastructure is hosted in secure, SOC 2 compliant data centers with 24/7 monitoring.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Security Practices</h2>
          <div className="max-w-3xl mx-auto prose">
            <h3>Regular Security Audits</h3>
            <p>
              We conduct regular security audits and penetration testing to identify and address potential vulnerabilities.
            </p>

            <h3>Employee Access Control</h3>
            <p>
              Strict access controls and regular security training ensure our team handles your data responsibly.
            </p>

            <h3>Incident Response</h3>
            <p>
              We maintain a comprehensive incident response plan and team ready to address any security concerns.
            </p>

            <h3>Compliance</h3>
            <p>
              Our security practices comply with industry standards and regulations including GDPR and CCPA.
            </p>

            <h3>Bug Bounty Program</h3>
            <p>
              We maintain an active bug bounty program to encourage responsible disclosure of security vulnerabilities.
            </p>

            <h3>Contact Security Team</h3>
            <p>
              For security-related inquiries or to report vulnerabilities, contact us at security@creatorhub.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}