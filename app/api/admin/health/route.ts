import { NextResponse } from "next/server";
import { requireAdmin } from "@/middleware/admin";
import { prisma } from "@/lib/prisma";
import os from "os";

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck) return authCheck;

  try {
    // System metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpuUsage = (os.loadavg()[0] * 100) / os.cpus().length;

    // Database health
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalIncome,
      totalTickets,
      openTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { suspended: false } }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.income.count(),
      prisma.support.count(),
      prisma.support.count({ where: { status: "open" } }),
    ]);

    // Generate mock historical data
    const history = Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - i);
      return {
        timestamp: date.toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        requests: Math.floor(Math.random() * 1000),
      };
    }).reverse();

    return NextResponse.json({
      system: {
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          usagePercent: (usedMemory / totalMemory) * 100,
        },
        cpu: {
          cores: os.cpus().length,
          usage: cpuUsage,
          model: os.cpus()[0].model,
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
      },
      database: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
        },
        income: {
          total: totalIncome,
        },
        support: {
          total: totalTickets,
          open: openTickets,
        },
      },
      history,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
