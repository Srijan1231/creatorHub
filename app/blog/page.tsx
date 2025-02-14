import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, User } from "lucide-react";

const BLOG_POSTS = [
  {
    id: 1,
    title: "Maximizing Your YouTube Revenue in 2025",
    excerpt: "Learn the latest strategies for optimizing your YouTube content for maximum revenue potential.",
    author: "Sarah Johnson",
    date: "2025-03-15",
    category: "YouTube",
  },
  {
    id: 2,
    title: "The Rise of Cross-Platform Content Creation",
    excerpt: "How to effectively manage and grow your presence across multiple social platforms.",
    author: "Michael Chen",
    date: "2025-03-10",
    category: "Strategy",
  },
  {
    id: 3,
    title: "Understanding Creator Analytics",
    excerpt: "A deep dive into the metrics that matter most for content creators.",
    author: "Alex Thompson",
    date: "2025-03-05",
    category: "Analytics",
  },
];

export default function BlogPage() {
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

      {/* Blog Header */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Creator Insights
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tips, strategies, and insights to help you grow your creator business.
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <div className="aspect-video bg-muted" />
                <div className="p-6">
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    {post.date}
                    <User className="h-4 w-4 ml-4 mr-2" />
                    {post.author}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <Button variant="outline" className="w-full">Read More</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}