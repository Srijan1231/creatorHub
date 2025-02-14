"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlatformConnectDialog } from "@/components/platform-connect-dialog";
import { NotificationsButton } from "@/components/notifications-button";
import { SignOutButton } from "@/components/ui/signout-button";
import {
  TrendingUp,
  Youtube,
  Music2,
  GitBranch as BrandTiktok,
  DollarSign,
  Settings,
  Bell,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span className="font-bold">CreatorHub</span>
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          <div className="space-y-1">
            <h4 className="px-2 py-1 text-sm font-semibold text-muted-foreground">Overview</h4>
            <Link href="/dashboard">
              <Button 
                variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/earnings">
              <Button 
                variant={pathname === "/dashboard/earnings" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Earnings
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <h4 className="px-2 py-1 text-sm font-semibold text-muted-foreground">Platforms</h4>
            <Link href="/dashboard/youtube">
              <Button 
                variant={pathname === "/dashboard/youtube" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Youtube className="mr-2 h-4 w-4 text-red-500" />
                YouTube
              </Button>
            </Link>
            <Link href="/dashboard/tiktok">
              <Button 
                variant={pathname === "/dashboard/tiktok" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <BrandTiktok className="mr-2 h-4 w-4 text-[#00F2EA]" />
                TikTok
              </Button>
            </Link>
            <Link href="/dashboard/spotify">
              <Button 
                variant={pathname === "/dashboard/spotify" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Music2 className="mr-2 h-4 w-4 text-[#1DB954]" />
                Spotify
              </Button>
            </Link>
            <Link href="/dashboard/patreon">
              <Button 
                variant={pathname === "/dashboard/patreon" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <DollarSign className="mr-2 h-4 w-4 text-[#FF424D]" />
                Patreon
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <h4 className="px-2 py-1 text-sm font-semibold text-muted-foreground">Settings</h4>
            <Link href="/dashboard/notifications">
              <Button 
                variant={pathname === "/dashboard/notifications" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button 
                variant={pathname === "/dashboard/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>

          <div className="pt-4">
            <SignOutButton />
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="h-16 border-b px-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Creator Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NotificationsButton />
            <PlatformConnectDialog />
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}