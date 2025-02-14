import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Briefcase, MapPin, Clock } from "lucide-react";

const OPEN_POSITIONS = [
  {
    id: 1,
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: 2,
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: 3,
    title: "Creator Success Manager",
    department: "Customer Success",
    location: "Remote",
    type: "Full-time",
  },
];

export default function CareersPage() {
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
            Join Our Team
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Help us build the future of creator tools and empower content creators worldwide.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2">Innovation First</h3>
              <p className="text-muted-foreground">
                We're constantly pushing boundaries and exploring new ways to help creators succeed.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2">Remote-First</h3>
              <p className="text-muted-foreground">
                Work from anywhere in the world. We believe in hiring the best talent, regardless of location.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2">Creator-Focused</h3>
              <p className="text-muted-foreground">
                Everything we do is aimed at making creators' lives easier and their businesses more successful.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {OPEN_POSITIONS.map((position) => (
              <Card key={position.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {position.department}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {position.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button>Apply Now</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}