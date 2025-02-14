import { NextResponse } from "next/server";
import { requireAdmin } from "@/middleware/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filter = searchParams.get("filter");

    const where = {
      ...(filter === "admin" ? { isSuperAdmin: false } : {}),
      ...(filter === "super" ? { isSuperAdmin: true } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.adminLog.count({ where }),
      prisma.adminLog.findMany({
        where,
        include: {
          admin: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authCheck = await requireAdmin(req);
  if (authCheck) return authCheck;

  try {
    const data = await req.json();
    const log = await prisma.adminLog.create({
      data,
      include: {
        admin: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
