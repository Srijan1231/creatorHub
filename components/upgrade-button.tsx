"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function UpgradeButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/pricing")}
      className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Upgrade to Pro
    </Button>
  );
}