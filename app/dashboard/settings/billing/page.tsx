"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { subscription, isLoading } = useSubscription();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        </div>
        <Card className="p-6">
          <div className="h-24 animate-pulse bg-muted rounded" />
        </Card>
      </div>
    );
  }

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const handleCancel = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to cancel subscription");

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current billing period.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Current Plan</h2>
              <p className="text-sm text-muted-foreground">
                Manage your subscription and billing
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {subscription?.status === "active" && (
                <span className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Active
                </span>
              )}
              {subscription?.status === "past_due" && (
                <span className="flex items-center text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Past Due
                </span>
              )}
              {subscription?.status === "canceled" && (
                <span className="flex items-center text-sm text-red-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  Canceled
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <span>Plan</span>
              </div>
              <p className="font-semibold capitalize">
                {subscription?.plan || "Free"}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <CreditCard className="h-4 w-4" />
                <span>Billing Period</span>
              </div>
              <p className="font-semibold">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "N/A"}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>Next Payment</span>
              </div>
              <p className="font-semibold">
                {subscription?.cancelAtPeriodEnd
                  ? "Cancels at period end"
                  : subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "N/A"}
              </p>
            </Card>
          </div>

          <div className="flex items-center space-x-4">
            {subscription?.plan === "core" && (
              <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
            )}
            {subscription?.plan === "pro" && (
              <Button variant="outline" onClick={handleUpgrade}>
                Change Plan
              </Button>
            )}
            {subscription?.status === "active" && !subscription?.cancelAtPeriodEnd && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to
              have access until the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Canceling..." : "Yes, Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}