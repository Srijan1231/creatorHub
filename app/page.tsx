"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Youtube,
  Music2,
  DollarSign,
  BarChart2,
  Zap,
  Shield,
  Users,
  GitBranch as BrandTiktok,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xl font-bold">CreatorHub</span>
          </div>
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            Unify Your Creator Income
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track, analyze, and optimize your earnings across all platforms. The
            all-in-one dashboard for modern content creators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Integration Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            All Your Platforms in One Place
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Youtube,
                title: "YouTube",
                color: "text-red-500",
                description:
                  "Track views, subscribers, and revenue from your channel",
              },
              {
                icon: BrandTiktok,
                title: "TikTok",
                color: "text-[#00F2EA]",
                description:
                  "Monitor engagement and growth across your content",
              },
              {
                icon: Music2,
                title: "Spotify",
                color: "text-[#1DB954]",
                description: "Track streams, followers, and music earnings",
              },
              {
                icon: DollarSign,
                title: "Patreon",
                color: "text-[#FF424D]",
                description:
                  "Manage patron relationships and subscription revenue",
              },
            ].map((platform) => (
              <Card key={platform.title} className="p-6">
                <platform.icon className={`h-12 w-12 ${platform.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-2">{platform.title}</h3>
                <p className="text-muted-foreground">{platform.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart2,
                title: "Advanced Analytics",
                description:
                  "Get deep insights into your content performance and audience engagement",
              },
              {
                icon: DollarSign,
                title: "Income Tracking",
                description:
                  "Track and analyze your earnings across all platforms in real-time",
              },
              {
                icon: Zap,
                title: "Smart Automation",
                description:
                  "Automate your reporting and get insights delivered to your inbox",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description:
                  "Your data is encrypted and protected with enterprise-grade security",
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description:
                  "Work together with your team and manage permissions",
              },
              {
                icon: TrendingUp,
                title: "Growth Insights",
                description:
                  "Get actionable recommendations to grow your audience and revenue",
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-6">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are growing their business with
            CreatorHub
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xl font-bold">CreatorHub</span>
              </div>
              <p className="text-muted-foreground">
                The ultimate platform for content creators
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/pricing"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} CreatorHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
