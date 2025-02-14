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

    if (!user?.platforms?.tiktok?.accessToken) {
      return NextResponse.json(
        { error: "TikTok not connected" },
        { status: 400 }
      );
    }

    // Fetch user info and stats
    const userResponse = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count`,
      {
        headers: {
          Authorization: `Bearer ${user.platforms.tiktok.accessToken}`,
        },
      }
    );

    const userData = await userResponse.json();

    // Fetch recent videos stats
    const videosResponse = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,view_count,like_count,comment_count,share_count,create_time`,
      {
        headers: {
          Authorization: `Bearer ${user.platforms.tiktok.accessToken}`,
        },
      }
    );

    const videosData = await videosResponse.json();

    // Store analytics
    await prisma.analytics.create({
      data: {
        userId: session.user.id,
        platform: "tiktok",
        date: new Date(),
        metrics: {
          followers: userData.data.follower_count,
          likes: userData.data.likes_count,
          views: videosData.data.videos.reduce(
            (acc: number, video: any) => acc + video.view_count,
            0
          ),
        },
      },
    });

    return NextResponse.json({
      profile: {
        name: userData.data.display_name,
        avatar: userData.data.avatar_url,
        followers: userData.data.follower_count,
        following: userData.data.following_count,
        likes: userData.data.likes_count,
        videos: userData.data.video_count,
      },
      recentVideos: videosData.data.videos.slice(0, 5).map((video: any) => ({
        id: video.id,
        title: video.title,
        cover: video.cover_image_url,
        views: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        shares: video.share_count,
        created: video.create_time,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
