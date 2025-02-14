import { NextResponse } from "next/server";
import { requireAdmin } from "@/middleware/admin";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const whereClause: Prisma.SupportWhereInput = {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    };

    const [total, tickets] = await Promise.all([
      prisma.support.count({
        where: whereClause,
      }),
      prisma.support.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          responses: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (req as any).adminId, // Set by requireAdmin middleware
        action: "VIEW_SUPPORT_TICKETS",
        method: "GET",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          status,
          priority,
          page,
          limit,
          total,
        },
      },
    });

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Support tickets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck) return authCheck;

  try {
    const { ticketId, update } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.support.update({
      where: { id: ticketId },
      data: {
        ...update,
        ...(update.assignedTo ? { assignedTo: update.assignedTo } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Create notification for status updates
    if (update.status) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: "support",
          title: "Support Ticket Updated",
          message: `Your support ticket status has been updated to ${update.status}.`,
          data: {
            ticketId: ticket.id,
            status: update.status,
          },
        },
      });
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (req as any).adminId, // Set by requireAdmin middleware
        action: "UPDATE_SUPPORT_TICKET",
        method: "PATCH",
        ip: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        details: {
          ticketId,
          update,
        },
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Support ticket update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
