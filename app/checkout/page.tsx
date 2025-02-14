"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, CreditCard, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PlanDetails {
  name: string;
  price: number;
  interval: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);

  useEffect(() => {
    // If not authenticated, redirect to sign up
    if (!session) {
      router.push("/auth/signup?redirect=/checkout");
      return;
    }

    // Get plan from URL or localStorage
    const urlPlan = searchParams.get("plan");
    const urlInterval = searchParams.get("interval");
    const storedPlan = localStorage.getItem("selectedPlan");
    const storedInterval = localStorage.getItem("billingInterval");

    const plan = urlPlan || storedPlan;
    const interval = urlInterval || storedInterval || "monthly";

    // Clear stored plan after retrieving
    localStorage.removeItem("selectedPlan");
    localStorage.removeItem("billingInterval");

    // In a real app, fetch plan details from your API
    const mockPlanDetails = {
      core: { name: "Core", price: interval === "yearly" ? 120 : 150 },
      pro: { name: "Pro", price: interval === "yearly" ? 200 : 250 },
    };

    if (plan && (plan === "core" || plan === "pro")) {
      setPlanDetails({
        name: mockPlanDetails[plan].name,
        price: mockPlanDetails[plan].price,
        interval: interval,
      });
    } else {
      router.push("/pricing");
    }
  }, [session, router, searchParams]);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      const plan = searchParams.get("plan");
      const interval = searchParams.get("interval");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!planDetails || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center mb-8">
            <TrendingUp className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">CreatorHub</span>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Complete your purchase</h1>
              <p className="text-muted-foreground">
                You're subscribing to {planDetails.name}
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>{planDetails.name} Plan ({planDetails.interval})</span>
                  <span>${planDetails.price}/mo</span>
                </div>
                {planDetails.interval === "yearly" && (
                  <div className="text-sm text-muted-foreground">
                    Includes 20% yearly discount
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    ${planDetails.price * (planDetails.interval === "yearly" ? 12 : 1)}
                    {planDetails.interval === "yearly" ? "/year" : "/month"}
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mr-2" />
                Secure checkout
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4 mr-2" />
                14-day money-back guarantee
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <Button
            onClick={handleCheckout}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : `Proceed to Checkout`}
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-4">
            By proceeding, you agree to our Terms of Service and acknowledge our Privacy Policy.
          </p>
        </Card>
      </div>
    </div>
  );
}