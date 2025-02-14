"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  LifeBuoy,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  async function checkAuthorization() {
    try {
      const response = await fetch("/api/admin/auth");
      if (!response.ok) {
        router.push("/auth/signin");
        return;
      }
      setIsAuthorized(true);
    } catch (error) {
      router.push("/auth/signin");
    }
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span className="font-bold">Admin Dashboard</span>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          <Link href="/admin/users">
            <Button
              variant={pathname === "/admin/users" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
          </Link>
          <Link href="/admin/support">
            <Button
              variant={pathname === "/admin/support" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <LifeBuoy className="mr-2 h-4 w-4" />
              Support
            </Button>
          </Link>
          <Link href="/admin/revenue">
            <Button
              variant={pathname === "/admin/revenue" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Revenue
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button
              variant={pathname === "/admin/settings" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
            onClick={() => router.push("/auth/signout")}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="h-16 border-b px-6 flex items-center">
          <h1 className="text-xl font-semibold">Admin Control Panel</h1>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}