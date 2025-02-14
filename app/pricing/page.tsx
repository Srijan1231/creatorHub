"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";
import {
  Check,
  TrendingUp,
  BarChart3,
  LineChart,
  Zap,
  AlertTriangle,
  X,
} from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handleUpgrade = (plan: string) => {
    if (!session) {
      localStorage.setItem("selectedPlan", plan);
      localStorage.setItem("billingInterval", billingInterval);
      router.push("/auth/signup?redirect=/checkout");
      return;
    }

    router.push(`/checkout?plan=${plan}&interval=${billingInterval}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 mr-2" />
            <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scale your creator business with the right tools and insights
          </p>

          <div className="flex items-center justify-center mt-8 space-x-4">
            <Button
              variant={billingInterval === "monthly" ? "default" : "outline"}
              onClick={() => setBillingInterval("monthly")}
            >
              Monthly billing
            </Button>
            <Button
              variant={billingInterval === "yearly" ? "default" : "outline"}
              onClick={() => setBillingInterval("yearly")}
            >
              Yearly billing
              <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(PLANS).map(([key, plan]) => (
            <Card
              key={key}
              className={`p-8 relative ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold">
                    $
                    {billingInterval === "yearly"
                      ? Math.floor(plan.price * 0.8)
                      : plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {plan.trialDays > 0 && (
                  <p className="text-sm text-emerald-600 font-medium mt-1">
                    {plan.trialDays}-day free trial
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {key === "starter" && "Perfect for new creators"}
                  {key === "core" && "Best value for growing creators"}
                  {key === "pro" && "For established creators"}
                </p>
              </div>

              <div className="space-y-4">
                <ul className="space-y-3 min-h-[320px]">
                  <li className="flex items-center">
                    {plan.features.platformConnections > 0 ? (
                      <Check className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                    )}
                    <span>
                      Connect up to {plan.features.platformConnections} platform
                      {plan.features.platformConnections !== 1 && "s"}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                    <span>
                      {plan.features.dataHistory === Infinity
                        ? "Unlimited"
                        : `${plan.features.dataHistory} days`}{" "}
                      data history
                    </span>
                  </li>
                  {Object.entries(plan.features)
                    .filter(
                      ([key]) =>
                        !["platformConnections", "dataHistory"].includes(key)
                    )
                    .map(([key, value]) => (
                      <li key={key} className="flex items-center">
                        {value ? (
                          <Check className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                        )}
                        <span>
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                        </span>
                      </li>
                    ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleUpgrade(key)}
                >
                  {key === "core" && plan.trialDays > 0
                    ? session
                      ? `Start ${plan.trialDays}-Day Free Trial`
                      : "Sign Up & Start Free Trial"
                    : `Get ${plan.name}`}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
