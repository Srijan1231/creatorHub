import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Globe, Award } from "lucide-react";

export default function AboutPage() {
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Mission</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Empowering creators to focus on what they do best - creating amazing
            content.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Our Team</h3>
              <p className="text-muted-foreground">
                A dedicated team of developers, designers, and creator advocates
                working to build the best tools for content creators.
              </p>
            </Card>
            <Card className="p-6">
              <Globe className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Our Reach</h3>
              <p className="text-muted-foreground">
                Supporting creators across multiple platforms, helping them
                manage and grow their content business globally.
              </p>
            </Card>
            <Card className="p-6">
              <Award className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Our Values</h3>
              <p className="text-muted-foreground">
                Committed to transparency, innovation, and putting creators
                first in everything we do.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
          <div className="max-w-3xl mx-auto prose">
            <p>
              Founded in 2025, CreatorHub was born from a simple observation:
              content creators spend too much time managing their business
              instead of creating content.
            </p>
            <p>
              We set out to build a platform that would simplify the complex
              world of creator analytics, income tracking, and platform
              management. Our goal is to give creators back their time while
              providing powerful insights to grow their business.
            </p>
            <p>
              Today, we&apos;re proud to serve thousands of creators worldwide,
              helping them understand their metrics, optimize their income, and
              make data-driven decisions about their content strategy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
