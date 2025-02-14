import { checkSubscriptionHealth } from "./subscription-recovery";
import { recordError } from "./monitoring";
import { shortTermCache, mediumTermCache, longTermCache } from "./cache";
import { getMetrics } from "./monitoring";
import { prisma } from "./prisma";

interface PlatformData {
  accessToken?: string;
  refreshToken?: string;
  status?: string;
  lastError?: string;
}

interface CronJob {
  name: string;
  interval: number;
  handler: () => Promise<void>;
  lastRun?: Date;
  isRunning: boolean;
}

class CronManager {
  private jobs: CronJob[] = [];
  private isInitialized: boolean = false;

  constructor() {
    // Register cron jobs
    this.registerJob({
      name: "subscription-health",
      interval: 24 * 60 * 60 * 1000, // Daily
      handler: async () => {
        try {
          await checkSubscriptionHealth();
        } catch (error) {
          recordError(
            "cron/subscription-health",
            "CRON",
            500,
            `Subscription health check failed: ${error}`
          );
        }
      },
    });

    this.registerJob({
      name: "cache-cleanup",
      interval: 60 * 60 * 1000, // Hourly
      handler: async () => {
        try {
          shortTermCache.cleanup();
          mediumTermCache.cleanup();
          longTermCache.cleanup();
        } catch (error) {
          recordError(
            "cron/cache-cleanup",
            "CRON",
            500,
            `Cache cleanup failed: ${error}`
          );
        }
      },
    });

    this.registerJob({
      name: "platform-connection-health",
      interval: 12 * 60 * 60 * 1000, // Every 12 hours
      handler: async () => {
        try {
          const users = await prisma.user.findMany({
            where: {
              platforms: {
                isNot: null,
              },
            },
            select: {
              id: true,
              platforms: true,
            },
          });

          for (const user of users) {
            if (!user.platforms) continue;

            const platforms = user.platforms as Record<string, PlatformData>;
            for (const [platform, data] of Object.entries(platforms)) {
              if (!data.accessToken) continue;

              try {
                // Check platform connection health
                const response = await fetch(
                  `${process.env.NEXTAUTH_URL}/api/platforms/${platform}/health`,
                  {
                    headers: {
                      Authorization: `Bearer ${data.accessToken}`,
                    },
                  }
                );

                if (!response.ok) {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: {
                      platforms: {
                        ...user.platforms,
                        [platform]: {
                          ...data,
                          status: "error",
                          lastError: `Health check failed: ${response.statusText}`,
                        },
                      },
                    },
                  });
                }
              } catch (error) {
                recordError(
                  "cron/platform-health",
                  "CRON",
                  500,
                  `Platform health check failed for ${platform}: ${error}`
                );
              }
            }
          }
        } catch (error) {
          recordError(
            "cron/platform-health",
            "CRON",
            500,
            `Platform health check failed: ${error}`
          );
        }
      },
    });

    this.registerJob({
      name: "invoice-cleanup",
      interval: 7 * 24 * 60 * 60 * 1000, // Weekly
      handler: async () => {
        try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          // Archive old draft invoices
          await prisma.income.updateMany({
            where: {
              status: "draft",
              createdAt: { lt: thirtyDaysAgo },
            },
            data: {
              status: "void",
            },
          });
        } catch (error) {
          recordError(
            "cron/invoice-cleanup",
            "CRON",
            500,
            `Invoice cleanup failed: ${error}`
          );
        }
      },
    });

    this.registerJob({
      name: "metrics-aggregation",
      interval: 5 * 60 * 1000, // Every 5 minutes
      handler: async () => {
        try {
          const metrics = getMetrics();
          // Store metrics in cache for monitoring dashboard
          mediumTermCache.set("system_metrics", metrics);

          // Alert on high error rates
          if (metrics.errorRate > 100) {
            // More than 100 errors in the last hour
            recordError(
              "cron/metrics",
              "CRON",
              500,
              `High error rate detected: ${metrics.errorRate} errors in the last hour`
            );
          }

          // Alert on slow endpoints
          metrics.slowestEndpoints.forEach((endpoint) => {
            if (endpoint.avgDuration > 1000) {
              // Slower than 1 second
              recordError(
                "cron/metrics",
                "CRON",
                500,
                `Slow endpoint detected: ${endpoint.endpoint} (${endpoint.avgDuration}ms)`
              );
            }
          });
        } catch (error) {
          recordError(
            "cron/metrics-aggregation",
            "CRON",
            500,
            `Metrics aggregation failed: ${error}`
          );
        }
      },
    });
  }

  private registerJob(job: Omit<CronJob, "isRunning" | "lastRun">) {
    this.jobs.push({
      ...job,
      isRunning: false,
      lastRun: undefined,
    });
  }

  public initialize() {
    if (this.isInitialized) {
      return;
    }

    // Start all jobs
    this.jobs.forEach((job) => {
      this.scheduleJob(job);
    });

    this.isInitialized = true;
    console.log(
      "Cron manager initialized with jobs:",
      this.jobs.map((j) => j.name).join(", ")
    );
  }

  private async scheduleJob(job: CronJob) {
    const runJob = async () => {
      if (job.isRunning) {
        console.log(`Job ${job.name} is already running, skipping`);
        return;
      }

      job.isRunning = true;
      const startTime = Date.now();

      try {
        await job.handler();
        job.lastRun = new Date();

        // Record job execution time
        const duration = Date.now() - startTime;
        if (duration > 30000) {
          // Alert if job takes more than 30 seconds
          recordError(
            `cron/${job.name}`,
            "CRON",
            500,
            `Job ${job.name} took too long: ${duration}ms`
          );
        }
      } catch (error) {
        recordError(
          `cron/${job.name}`,
          "CRON",
          500,
          `Job ${job.name} failed: ${error}`
        );
      } finally {
        job.isRunning = false;
      }
    };

    // Initial run with a random delay to prevent all jobs starting at once
    const initialDelay = Math.random() * 60000; // Random delay up to 1 minute
    setTimeout(() => runJob(), initialDelay);

    // Schedule recurring runs
    setInterval(runJob, job.interval);
  }

  public getStatus() {
    return this.jobs.map((job) => ({
      name: job.name,
      lastRun: job.lastRun?.toISOString(),
      isRunning: job.isRunning,
      interval: job.interval,
      nextRun: job.lastRun
        ? new Date(job.lastRun.getTime() + job.interval).toISOString()
        : new Date(Date.now() + job.interval).toISOString(),
    }));
  }
}

// Create singleton instance
const cronManager = new CronManager();

// Export singleton
export default cronManager;
