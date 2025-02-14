"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface PlanLimitWarningProps {
  title: string;
  description: string;
}

export function PlanLimitWarning({ title, description }: PlanLimitWarningProps) {
  const router = useRouter();

  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{description}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pricing")}
        >
          Upgrade Plan
        </Button>
      </AlertDescription>
    </Alert>
  );
}