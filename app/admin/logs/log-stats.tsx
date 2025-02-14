import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, AlertTriangle, Info } from "lucide-react";

interface LogStats {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  slowRequests: number;
  averageResponseTime: number;
}

export default function LogStats() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<LogStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const date =
          searchParams.get("date") || new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/admin/logs?date=${date}`);
        const data = await response.json();

        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch log stats:", error);
      }
    };

    fetchStats();
  }, [searchParams]);

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Total Logs",
      value: stats.totalLogs.toLocaleString(),
      icon: Info,
      className: "bg-blue-500",
    },
    {
      title: "Errors",
      value: stats.errorCount.toLocaleString(),
      icon: AlertCircle,
      className: "bg-red-500",
    },
    {
      title: "Warnings",
      value: stats.warningCount.toLocaleString(),
      icon: AlertTriangle,
      className: "bg-yellow-500",
    },
    {
      title: "Slow Requests",
      value: stats.slowRequests.toLocaleString(),
      icon: Clock,
      description: `Avg: ${Math.round(stats.averageResponseTime)}ms`,
      className: "bg-orange-500",
    },
  ];

  return (
    <>
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon
              className={`h-4 w-4 text-white rounded-full p-0.5 ${stat.className}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
