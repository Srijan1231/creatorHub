import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DatePicker } from "@/components/ui/date-picker";
import LogStats from "./log-stats";
import LogViewer from "./log-viewer";

export default function AdminLogsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <DatePicker />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Suspense fallback={<div>Loading stats...</div>}>
          <LogStats />
        </Suspense>
      </div>

      <Card>
        <CardHeader className="space-y-0 pb-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Logs</TabsTrigger>
              <TabsTrigger value="error">Errors</TabsTrigger>
              <TabsTrigger value="warn">Warnings</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading logs...</div>}>
            <LogViewer />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
