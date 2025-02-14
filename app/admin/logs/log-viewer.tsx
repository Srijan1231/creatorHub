import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Log {
  timestamp: string;
  level: string;
  endpoint: string;
  method: string;
  duration?: number;
  error?: string;
  message?: string;
}

export default function LogViewer() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<Record<string, Log[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const date =
          searchParams.get("date") || new Date().toISOString().split("T")[0];
        const type = searchParams.get("type");

        const response = await fetch(
          `/api/admin/logs?date=${date}${type ? `&type=${type}` : ""}`
        );
        const data = await response.json();

        if (data.logs) {
          setLogs(data.logs);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [searchParams]);

  if (loading) {
    return <div>Loading logs...</div>;
  }

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return "bg-red-500";
      case "WARN":
        return "bg-yellow-500";
      case "INFO":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <ScrollArea className="h-[600px] w-full">
      {Object.entries(logs).map(([level, levelLogs]) => (
        <div key={level} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{level}</h3>
          <div className="space-y-2">
            {levelLogs.map((log, index) => (
              <div
                key={index}
                className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getLevelColor(log.level)}>
                    {log.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-semibold">Endpoint:</span>{" "}
                    {log.method} {log.endpoint}
                  </div>
                  {log.duration && (
                    <div>
                      <span className="font-semibold">Duration:</span>{" "}
                      {log.duration}ms
                    </div>
                  )}
                  {log.error && (
                    <div className="col-span-2 text-red-500">
                      <span className="font-semibold">Error:</span> {log.error}
                    </div>
                  )}
                  {log.message && (
                    <div className="col-span-2">
                      <span className="font-semibold">Message:</span>{" "}
                      {log.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </ScrollArea>
  );
}
