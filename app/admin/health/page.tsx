"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Server,
  Database,
  Memory,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface SystemHealth {
  uptime: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  database: {
    status: string;
    connections: number;
    queries: number;
  };
  services: {
    name: string;
    status: string;
    latency: number;
  }[];
  metrics: {
    requestsPerMinute: number;
    errorsPerMinute: number;
    averageResponseTime: number;
  };
  history: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    requests: number;
  }>;
}

export default function HealthPage() {
  const { toast } = useToast();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    try {
      const response = await fetch("/api/admin/health");
      const data = await response.json();

      if (response.ok) {
        setHealth(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch system health",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!health) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Health</h1>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                System Uptime
              </p>
              <p className="text-2xl font-bold">
                {Math.floor(health.uptime / 86400)}d{" "}
                {Math.floor((health.uptime % 86400) / 3600)}h
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Memory Usage
              </p>
              <p className="text-2xl font-bold">
                {Math.round((health.memory.used / health.memory.total) * 100)}%
              </p>
            </div>
            <Memory className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                CPU Usage
              </p>
              <p className="text-2xl font-bold">
                {Math.round(health.cpu.usage)}%
              </p>
            </div>
            <Server className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Database Connections
              </p>
              <p className="text-2xl font-bold">
                {health.database.connections}
              </p>
            </div>
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Metrics</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={health.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#8884d8"
                  name="CPU Usage"
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#82ca9d"
                  name="Memory Usage"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Service Status</h2>
          <div className="space-y-4">
            {health.services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Activity className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Latency: {service.latency}ms
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    service.status === "healthy"
                      ? "bg-green-100 text-green-800"
                      : service.status === "degraded"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">System Alerts</h2>
        <div className="space-y-4">
          {health.metrics.errorsPerMinute > 10 && (
            <div className="flex items-center space-x-2 p-4 bg-red-100 text-red-800 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              <p>
                High error rate detected: {health.metrics.errorsPerMinute}{" "}
                errors/minute
              </p>
            </div>
          )}
          {health.cpu.usage > 80 && (
            <div className="flex items-center space-x-2 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              <p>High CPU usage: {Math.round(health.cpu.usage)}%</p>
            </div>
          )}
          {health.memory.used / health.memory.total > 0.8 && (
            <div className="flex items-center space-x-2 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              <p>
                High memory usage:{" "}
                {Math.round((health.memory.used / health.memory.total) * 100)}%
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
