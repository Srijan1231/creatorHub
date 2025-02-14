"use client";

import { useEffect, useState } from "react";
import { UserSubscription } from "@/types/plans";

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/subscriptions");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  return {
    subscription,
    isLoading,
    isProPlan: subscription?.plan === "pro",
    isCorePlan: subscription?.plan === "core",
  };
}