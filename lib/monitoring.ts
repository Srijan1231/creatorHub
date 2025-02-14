import { NextResponse } from "next/server";
import { writeFile, appendFile, mkdir } from "fs/promises";
import { join } from "path";
import { mediumTermCache } from "./cache";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

// Define log directory
const LOG_DIR = join(process.cwd(), "logs");

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET = process.env.AWS_LOGS_BUCKET || "your-logs-bucket";

interface ErrorMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  errorMessage: string;
  timestamp: Date;
}

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
}

// In-memory storage for metrics
const metrics = {
  errors: [] as ErrorMetrics[],
  performance: [] as PerformanceMetrics[],
  maxStorageSize: 1000,
};

// Upload log to S3
async function uploadLogToS3(logType: string, content: string) {
  if (process.env.NODE_ENV !== "production") return;

  const date = new Date().toISOString().split("T")[0];
  const key = `logs/${date}/${logType}-${Date.now()}.json`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: content,
        ContentType: "application/json",
      })
    );
  } catch (error) {
    console.error(`Failed to upload log to S3: ${error}`);
  }
}

// Fetch logs from S3 for admin UI
export async function fetchLogsFromS3(date: string, logType?: string) {
  const prefix = logType ? `logs/${date}/${logType}` : `logs/${date}`;

  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
      })
    );

    const logPromises = (response.Contents || []).map(async (object) => {
      const logResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: object.Key,
        })
      );

      const logContent = await logResponse.Body?.transformToString();
      return logContent ? JSON.parse(logContent) : null;
    });

    const logs = await Promise.all(logPromises);
    return logs.filter(Boolean);
  } catch (error) {
    console.error(`Failed to fetch logs from S3: ${error}`);
    return [];
  }
}

// Ensure log directory exists
async function ensureLogDir() {
  try {
    await mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create log directory:", error);
  }
}

// Initialize log files
async function initializeLogs() {
  const date = new Date().toISOString().split("T")[0];
  await ensureLogDir();

  const files = {
    error: join(LOG_DIR, `error-${date}.log`),
    access: join(LOG_DIR, `access-${date}.log`),
    performance: join(LOG_DIR, `performance-${date}.log`),
  };

  return files;
}

// Format log entry
function formatLogEntry(data: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, ...data };
  return JSON.stringify(logData);
}

export async function recordError(
  endpoint: string,
  method: string,
  statusCode: number,
  error: unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logFiles = await initializeLogs();

  const errorMetric: ErrorMetrics = {
    endpoint,
    method,
    statusCode,
    errorMessage,
    timestamp: new Date(),
  };

  // Add to in-memory metrics
  metrics.errors.push(errorMetric);
  if (metrics.errors.length > metrics.maxStorageSize) {
    metrics.errors.shift();
  }

  // Format log entry
  const logEntry = formatLogEntry({
    level: "ERROR",
    endpoint,
    method,
    statusCode,
    error: errorMessage,
  });

  // Write to local file
  try {
    await appendFile(logFiles.error, logEntry + "\n");
  } catch (e) {
    console.error("Failed to write error log:", e);
  }

  // Upload to S3
  await uploadLogToS3("error", logEntry);

  // Alert on critical errors
  if (statusCode >= 500) {
    console.error(`[CRITICAL] ${method} ${endpoint} - ${errorMessage}`);
    // Store critical error in cache for dashboard
    const criticalErrors =
      mediumTermCache.get<string[]>("critical_errors") || [];
    criticalErrors.unshift(logEntry);
    if (criticalErrors.length > 10) criticalErrors.pop();
    mediumTermCache.set("critical_errors", criticalErrors);
  }
}

export async function recordPerformance(
  endpoint: string,
  method: string,
  duration: number
): Promise<void> {
  const logFiles = await initializeLogs();

  const performanceMetric: PerformanceMetrics = {
    endpoint,
    method,
    duration,
    timestamp: new Date(),
  };

  // Add to in-memory metrics
  metrics.performance.push(performanceMetric);
  if (metrics.performance.length > metrics.maxStorageSize) {
    metrics.performance.shift();
  }

  // Write to log file if duration exceeds threshold
  if (duration > 1000) {
    // Log slow requests (>1s)
    const logEntry = formatLogEntry({
      level: "WARN",
      endpoint,
      method,
      duration,
      message: "Slow request detected",
    });

    try {
      await appendFile(logFiles.performance, logEntry + "\n");
      await uploadLogToS3("performance", logEntry);
    } catch (e) {
      console.error("Failed to write performance log:", e);
    }
  }

  // Record access log
  const accessLogEntry = formatLogEntry({
    level: "INFO",
    endpoint,
    method,
    duration,
  });

  try {
    await appendFile(logFiles.access, accessLogEntry + "\n");
    await uploadLogToS3("access", accessLogEntry);
  } catch (e) {
    console.error("Failed to write access log:", e);
  }
}

export function getMetrics() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // Calculate error rate for the last hour
  const recentErrors = metrics.errors.filter(
    (error) => error.timestamp.getTime() > oneHourAgo
  );

  // Calculate average response time for the last hour
  const recentPerformance = metrics.performance.filter(
    (perf) => perf.timestamp.getTime() > oneHourAgo
  );

  const avgResponseTime =
    recentPerformance.reduce((sum, perf) => sum + perf.duration, 0) /
    (recentPerformance.length || 1);

  // Get critical errors from cache
  const criticalErrors = mediumTermCache.get<string[]>("critical_errors") || [];

  return {
    errorRate: recentErrors.length,
    avgResponseTime,
    recentErrors: recentErrors.slice(-10), // Last 10 errors
    criticalErrors,
    slowestEndpoints: getTopSlowestEndpoints(recentPerformance),
  };
}

function getTopSlowestEndpoints(performances: PerformanceMetrics[]) {
  const endpointStats = new Map<string, { total: number; count: number }>();

  // Calculate average duration for each endpoint
  performances.forEach((perf) => {
    const key = `${perf.method} ${perf.endpoint}`;
    const current = endpointStats.get(key) || { total: 0, count: 0 };
    endpointStats.set(key, {
      total: current.total + perf.duration,
      count: current.count + 1,
    });
  });

  // Convert to array and sort by average duration
  return Array.from(endpointStats.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      avgDuration: stats.total / stats.count,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 5); // Top 5 slowest endpoints
}

export function withErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const startTime = Date.now();
    const method = req.method;
    const endpoint = new URL(req.url).pathname;

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;
      await recordPerformance(endpoint, method, duration);
      return response;
    } catch (error) {
      const statusCode =
        error instanceof Error && "status" in error
          ? (error as any).status
          : 500;
      await recordError(endpoint, method, statusCode, error);

      return NextResponse.json(
        {
          error: "Internal server error",
          requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
        { status: statusCode }
      );
    }
  };
}

// Initialize logs on startup
if (process.env.NODE_ENV === "production") {
  ensureLogDir().catch(console.error);
}
