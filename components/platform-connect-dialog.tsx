"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Youtube,
  Music2,
  GitBranch as BrandTiktok,
  DollarSign,
} from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const platforms: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    description: "Connect your YouTube channel to track views, subscribers, and revenue.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: BrandTiktok,
    color: "#00F2EA",
    description: "Track your TikTok followers, views, and engagement metrics.",
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: Music2,
    color: "#1DB954",
    description: "Monitor your Spotify streams, followers, and earnings.",
  },
  {
    id: "patreon",
    name: "Patreon",
    icon: DollarSign,
    color: "#FF424D",
    description: "Track your Patreon supporters and subscription revenue.",
  },
];

export function PlatformConnectDialog() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function connectPlatform(platformId: string) {
    try {
      setIsLoading(platformId);
      const response = await fetch(`/api/platforms/${platformId}/auth`);
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error(`Error connecting to ${platformId}:`, error);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Connect Platform</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Platform</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex items-start space-x-4 p-4 rounded-lg border"
            >
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: `${platform.color}20` }}
              >
                <platform.icon
                  className="h-6 w-6"
                  style={{ color: platform.color }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium leading-none">{platform.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {platform.description}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => connectPlatform(platform.id)}
                disabled={isLoading === platform.id}
              >
                {isLoading === platform.id ? "Connecting..." : "Connect"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}