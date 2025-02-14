"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Youtube,
  Music2,
  DollarSign,
  Users,
  Eye,
  TrendingUp,
  GitBranch as BrandTiktok,
} from "lucide-react";

interface DashboardData {
  totals: {
    followers: number;
    views: number;
    earnings: number;
    platforms: number;
  };
  platformMetrics: {
    [key: string]: {
      followers: number;
      views: number;
      engagement: number;
      earnings: number;
      history: Array<{
        date: string;
        followers: number;
        views: number;
      }>;
    };
  };
  timeline: Array<{
    date: string;
    [key: string]: any;
  }>;
}

const PLATFORM_COLORS = {
  youtube: "#FF0000",
  tiktok: "#00F2EA",
  spotify: "#1DB954",
  patreon: "#FF424D",
};

const PLATFORM_ICONS = {
  youtube: Youtube,
  tiktok: BrandTiktok,
  spotify: Music2,
  patreon: DollarSign,
};

// Add historical data for timeline
const generateHistoricalData = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      youtube: {
        followers: Math.floor(500000 - i * 1000 + Math.random() * 500),
        views: Math.floor(2500000 - i * 5000 + Math.random() * 2500),
      },
      tiktok: {
        followers: Math.floor(400000 - i * 800 + Math.random() * 400),
        views: Math.floor(1500000 - i * 3000 + Math.random() * 1500),
      },
      spotify: {
        followers: Math.floor(150000 - i * 300 + Math.random() * 150),
        views: Math.floor(500000 - i * 1000 + Math.random() * 500),
      },
      patreon: {
        followers: Math.floor(200000 - i * 400 + Math.random() * 200),
        views: Math.floor(500000 - i * 1000 + Math.random() * 500),
      },
    };
  });
};

const DEFAULT_DATA: DashboardData = {
  totals: {
    followers: 0,
    views: 0,
    earnings: 0,
    platforms: 0,
  },
  platformMetrics: {},
  timeline: generateHistoricalData(30),
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/overview?period=${period}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const newData = await response.json();
      
      if (response.ok) {
        setData(newData);
      } else {
        console.error("Error fetching dashboard data:", newData.error);
        setData(DEFAULT_DATA);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-32" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="h-[400px] bg-muted rounded" />
        </Card>
      </div>
    );
  }

  const platformDistribution = Object.entries(data.platformMetrics || {})
    .filter(([_, metrics]) => metrics.earnings > 0)
    .map(([platform, metrics]) => ({
      name: platform,
      value: metrics.earnings,
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="flex items-center space-x-2">
          {["7d", "30d", "90d", "1y"].map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
            >
              {p === "7d" ? "7 Days" : 
               p === "30d" ? "30 Days" :
               p === "90d" ? "90 Days" : "1 Year"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <h3 className="text-sm font-medium">Total Earnings</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${data.totals.earnings.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-medium">Total Followers</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {data.totals.followers.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-medium">Total Views</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {data.totals.views.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-medium">Active Platforms</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {data.totals.platforms}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Growth Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                {Object.keys(data.platformMetrics || {}).map((platform) => (
                  <Line
                    key={platform}
                    type="monotone"
                    dataKey={`${platform}.followers`}
                    name={`${platform} followers`}
                    stroke={PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {platformDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PLATFORM_COLORS[entry.name as keyof typeof PLATFORM_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(data.platformMetrics || {}).map(([platform, metrics]) => {
          const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS];
          return (
            <Card key={platform} className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Icon className="h-5 w-5" style={{ color: PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] }} />
                <h3 className="font-semibold capitalize">{platform}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Followers</span>
                  <span className="font-medium">{metrics.followers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Views</span>
                  <span className="font-medium">{metrics.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Earnings</span>
                  <span className="font-medium">${metrics.earnings.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}