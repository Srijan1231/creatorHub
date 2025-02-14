"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Activity, Shield } from "lucide-react";

interface AuditLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  method: string;
  isSuperAdmin: boolean;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export default function AuditPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  async function fetchLogs() {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        filter,
      });

      const response = await fetch(`/api/admin/audit?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <div className="flex items-center space-x-2">
          <Select
            value={filter}
            onValueChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user">User Actions</SelectItem>
              <SelectItem value="admin">Admin Actions</SelectItem>
              <SelectItem value="super">Super Admin Actions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>User Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {log.isSuperAdmin && (
                      <Shield className="h-4 w-4 text-purple-500" />
                    )}
                    <span>{log.userId.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>{log.action}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      log.method === "GET"
                        ? "bg-blue-100 text-blue-800"
                        : log.method === "POST"
                        ? "bg-green-100 text-green-800"
                        : log.method === "PATCH"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.method}
                  </span>
                </TableCell>
                <TableCell>{log.ip}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {log.userAgent}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
