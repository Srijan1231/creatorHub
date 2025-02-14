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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        platforms: true,
      },
    });

    if (!user?.platforms?.patreon?.accessToken) {
      return NextResponse.json(
        { error: "Patreon not connected" },
        { status: 400 }
      );
    }

    // Fetch campaign data
    const campaignResponse = await fetch(
      "https://www.patreon.com/api/oauth2/v2/campaigns?" +
        "include=tiers,benefits,goals&" +
        "fields[campaign]=creation_name,creation_count,patron_count,earnings_visibility,is_monthly," +
        "is_charged_immediately,is_charge_upfront,show_earnings,published_at",
      {
        headers: {
          Authorization: `Bearer ${user.platforms.patreon.accessToken}`,
        },
      }
    );

    const campaignData = await campaignResponse.json();
    const campaign = campaignData.data[0];

    // Fetch patron data
    const patronsResponse = await fetch(
      `https://www.patreon.com/api/oauth2/v2/campaigns/${campaign.id}/members?` +
        "include=currently_entitled_tiers,address&" +
        "fields[member]=full_name,email,patron_status,lifetime_support_cents,currently_entitled_amount_cents," +
        "last_charge_date,next_charge_date,pledge_relationship_start",
      {
        headers: {
          Authorization: `Bearer ${user.platforms.patreon.accessToken}`,
        },
      }
    );

    const patronsData = await patronsResponse.json();

    // Calculate total earnings
    const totalEarnings = patronsData.data.reduce(
      (sum: number, patron: any) =>
        sum + patron.attributes.currently_entitled_amount_cents / 100,
      0
    );

    // Store analytics
    await prisma.analytics.create({
      data: {
        userId: session.user.id,
        platform: "patreon",
        date: new Date(),
        metrics: {
          patrons: patronsData.data.length,
          earnings: totalEarnings,
        },
      },
    });

    return NextResponse.json({
      campaign: {
        name: campaign.attributes.creation_name,
        patronCount: campaign.attributes.patron_count,
        postCount: campaign.attributes.creation_count,
        monthlyEarnings: totalEarnings,
      },
      tiers: campaignData.included
        .filter((item: any) => item.type === "tier")
        .map((tier: any) => ({
          id: tier.id,
          title: tier.attributes.title,
          description: tier.attributes.description,
          amount: tier.attributes.amount_cents / 100,
          patronCount: tier.attributes.patron_count,
          imageUrl: tier.attributes.image_url,
        })),
      patrons: patronsData.data.map((patron: any) => ({
        id: patron.id,
        name: patron.attributes.full_name,
        status: patron.attributes.patron_status,
        lifetimeSupport: patron.attributes.lifetime_support_cents / 100,
        currentAmount: patron.attributes.currently_entitled_amount_cents / 100,
        joinedAt: patron.attributes.pledge_relationship_start,
        nextCharge: patron.attributes.next_charge_date,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
