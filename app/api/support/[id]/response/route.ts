import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();

    // First verify the ticket exists and belongs to the user
    const ticket = await prisma.support.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create the response
    const response = await prisma.response.create({
      data: {
        message,
        userId: session.user.id,
        supportId: params.id,
      },
    });

    // Get updated ticket with all responses
    const updatedTicket = await prisma.support.findUnique({
      where: { id: params.id },
      include: {
        responses: {
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

    return NextResponse.json(updatedTicket);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
