"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Plus,
  Youtube,
  Music2,
  GitBranch as BrandTiktok,
  Filter,
} from "lucide-react";

const PLATFORM_COLORS = {
  youtube: "#FF0000",
  tiktok: "#00F2EA",
  spotify: "#1DB954",
  patreon: "#FF424D",
};

interface IncomeData {
  income: Array<{
    id: string;
    platform: string;
    amount: number;
    currency: string;
    date: string;
    description: string;
    category: string;
  }>;
  summary: {
    total: number;
    byPlatform: { [key: string]: number };
    byCategory: { [key: string]: number };
  };
}

const DEFAULT_DATA: IncomeData = {
  income: [],
  summary: {
    total: 0,
    byPlatform: {},
    byCategory: {},
  },
};

export default function EarningsDashboard() {
  const [data, setData] = useState<IncomeData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    platform: "",
    startDate: "",
    endDate: "",
    category: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIncomeData();
  }, [filters]);

  async function fetchIncomeData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.platform) params.append("platform", filters.platform);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.category) params.append("category", filters.category);

      const response = await fetch(`/api/income?${params}`);
      const newData = await response.json();
      
      if (response.ok) {
        setData(newData);
      } else {
        console.error("Error fetching income data:", newData.error);
        setData(DEFAULT_DATA);
        toast({
          title: "Error",
          description: "Failed to fetch income data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching income data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch income data",
        variant: "destructive",
      });
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }

  async function addIncome(formData: FormData) {
    try {
      const income = {
        platform: formData.get("platform"),
        amount: parseFloat(formData.get("amount") as string),
        currency: formData.get("currency"),
        date: formData.get("date"),
        description: formData.get("description"),
        category: formData.get("category"),
      };

      const response = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(income),
      });

      if (!response.ok) throw new Error("Failed to add income");

      toast({
        title: "Success",
        description: "Income entry added successfully",
      });

      fetchIncomeData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add income entry",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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

  const platformDistribution = Object.entries(data.summary.byPlatform || {})
    .filter(([_, amount]) => amount > 0)
    .map(([platform, amount]) => ({
      name: platform,
      value: amount,
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Income Tracking</h1>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Income Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                addIncome(new FormData(e.currentTarget));
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select name="platform" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="patreon">Patreon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ad_revenue">Ad Revenue</SelectItem>
                      <SelectItem value="sponsorships">Sponsorships</SelectItem>
                      <SelectItem value="subscriptions">Subscriptions</SelectItem>
                      <SelectItem value="donations">Donations</SelectItem>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    type="text"
                  />
                </div>
                <Button type="submit" className="w-full">Add Income</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Income</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={filters.platform}
                    onValueChange={(value) =>
                      setFilters({ ...filters, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All platforms</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="patreon">Patreon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                    />
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      setFilters({ ...filters, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="ad_revenue">Ad Revenue</SelectItem>
                      <SelectItem value="sponsorships">Sponsorships</SelectItem>
                      <SelectItem value="subscriptions">Subscriptions</SelectItem>
                      <SelectItem value="donations">Donations</SelectItem>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <h3 className="text-sm font-medium">Total Income</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            ${data.summary.total.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Youtube className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-medium">Top Platform</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {Object.entries(data.summary.byPlatform || {})
              .sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-medium">Top Category</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {Object.entries(data.summary.byCategory || {})
              .sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Income Distribution</h3>
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

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {data.income.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium capitalize">{entry.platform}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.description || entry.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${entry.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All Transactions</h3>
        <div className="space-y-4">
          {data.income.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div>
                <div className="flex items-center space-x-2">
                  {entry.platform === "youtube" && (
                    <Youtube className="h-4 w-4 text-red-500" />
                  )}
                  {entry.platform === "tiktok" && (
                    <BrandTiktok className="h-4 w-4 text-[#00F2EA]" />
                  )}
                  {entry.platform === "spotify" && (
                    <Music2 className="h-4 w-4 text-[#1DB954]" />
                  )}
                  {entry.platform === "patreon" && (
                    <DollarSign className="h-4 w-4 text-[#FF424D]" />
                  )}
                  <p className="font-medium capitalize">{entry.platform}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {entry.description || entry.category}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  ${entry.amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}