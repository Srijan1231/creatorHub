import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.support.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        responses: true,
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const ticket = await prisma.support.create({
      data: {
        userId: session.user.id,
        subject: data.subject,
        message: data.message,
        category: data.category,
        priority: data.priority,
        status: "open",
      },
      include: {
        responses: true,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
