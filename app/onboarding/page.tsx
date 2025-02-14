"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  AlertCircle,
  Youtube,
  Music2,
  GitBranch as BrandTiktok,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  completed: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: "verify-email",
      title: "Verify Your Email",
      description: "Check your inbox for a verification link",
      icon: CheckCircle,
      color: "text-green-500",
      completed: emailVerified,
    },
    {
      id: "connect-platform",
      title: "Connect Your First Platform",
      description: "Connect YouTube, TikTok, Spotify, or Patreon",
      icon: Youtube,
      color: "text-red-500",
      completed: false,
    },
    {
      id: "setup-profile",
      title: "Complete Your Profile",
      description: "Add your name and profile information",
      icon: AlertCircle,
      color: "text-blue-500",
      completed: false,
    },
  ];

  useEffect(() => {
    checkEmailVerification();
  }, []);

  async function checkEmailVerification() {
    try {
      const response = await fetch("/api/user");
      const data = await response.json();
      setEmailVerified(data.emailVerified);
    } catch (error) {
      console.error("Error checking email verification:", error);
    }
  }

  async function connectPlatform(platform: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/platforms/${platform}/auth`);
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to connect ${platform}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding() {
    try {
      setLoading(true);
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to CreatorHub</h1>
          <p className="text-muted-foreground mt-2">
            Let's get you set up in just a few steps
          </p>
        </div>

        <div className="grid gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className={`p-6 ${
                currentStep === index ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-2 rounded-full ${
                      step.completed ? "bg-green-100" : "bg-muted"
                    }`}
                  >
                    <step.icon
                      className={`h-6 w-6 ${
                        step.completed ? "text-green-500" : step.color
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                {currentStep === index && !step.completed && (
                  <div>
                    {step.id === "connect-platform" ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectPlatform("youtube")}
                          disabled={loading}
                        >
                          <Youtube className="h-4 w-4 mr-2 text-red-500" />
                          YouTube
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectPlatform("tiktok")}
                          disabled={loading}
                        >
                          <BrandTiktok className="h-4 w-4 mr-2 text-[#00F2EA]" />
                          TikTok
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectPlatform("spotify")}
                          disabled={loading}
                        >
                          <Music2 className="h-4 w-4 mr-2 text-[#1DB954]" />
                          Spotify
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectPlatform("patreon")}
                          disabled={loading}
                        >
                          <DollarSign className="h-4 w-4 mr-2 text-[#FF424D]" />
                          Patreon
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          if (step.id === "setup-profile") {
                            completeOnboarding();
                          } else {
                            setCurrentStep(index + 1);
                          }
                        }}
                        disabled={loading || !steps[index - 1]?.completed}
                      >
                        {step.id === "setup-profile" ? (
                          "Complete Setup"
                        ) : (
                          <>
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}