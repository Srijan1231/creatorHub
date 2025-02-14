import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MOCK_INCOME_DATA } from "@/lib/mock-data";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

// Add dynamic config to prevent static export errors
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", ...MOCK_INCOME_DATA },
        { status: 401 }
      );
    }

    if (USE_MOCK_DATA) {
      return NextResponse.json(MOCK_INCOME_DATA);
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where = {
      userId: session.user.id,
      ...(platform ? { platform } : {}),
      ...(status ? { status } : {}),
      ...(startDate && endDate
        ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    };

    const income = await prisma.income.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(income);
  } catch (error) {
    console.error("Income API error:", error);
    return NextResponse.json(MOCK_INCOME_DATA);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (USE_MOCK_DATA) {
      return NextResponse.json({ success: true });
    }

    const data = await req.json();

    const income = await prisma.income.create({
      data: {
        ...data,
        userId: session.user.id,
        date: new Date(data.date),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error("Income API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
