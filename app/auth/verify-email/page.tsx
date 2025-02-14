"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setIsVerifying(false);
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  async function verifyEmail(token: string) {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error("Verification failed");

      setIsSuccess(true);
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified.",
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Unable to verify your email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8" />
            <span className="text-2xl font-bold">CreatorHub</span>
          </div>
        </div>

        <Card className="p-6 text-center">
          {isVerifying ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p>Verifying your email...</p>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Email Verified</h2>
              <p className="text-muted-foreground">
                Your email has been successfully verified.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Verification Failed</h2>
              <p className="text-muted-foreground">
                Unable to verify your email. The link may be expired or invalid.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/auth/signin")}
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}