"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Bell } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            <Link href="/dashboard/settings">
              <Button
                variant={pathname === "/dashboard/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <User className="mr-2 h-4 w-4" />
                Account
              </Button>
            </Link>
            <Link href="/dashboard/settings/billing">
              <Button
                variant={pathname === "/dashboard/settings/billing" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Button>
            </Link>
            <Link href="/dashboard/settings/notifications">
              <Button
                variant={pathname === "/dashboard/settings/notifications" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
            </Link>
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}