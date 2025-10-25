import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, TrendingUp, Users, PackageCheck, Wine, AlertTriangle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DashboardMetrics, TrendData } from "@shared/schema";

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/metrics"],
  });

  const { data: efficiencyTrend } = useQuery<TrendData[]>({
    queryKey: ["/api/metrics/efficiency-trend"],
  });

  const { data: foodSavedTrend } = useQuery<TrendData[]>({
    queryKey: ["/api/metrics/food-saved-trend"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const bottleDistribution = [
    { name: "Reused", value: metrics?.bottlesReused || 0, color: "hsl(var(--chart-2))" },
    { name: "Combined", value: metrics?.bottlesCombined || 0, color: "hsl(var(--chart-3))" },
    { name: "Discarded", value: metrics?.bottlesDiscarded || 0, color: "hsl(var(--chart-5))" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time metrics and performance analytics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-metric-flights">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-flights">{metrics?.totalFlights || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active operations</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-reliability">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Reliability</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-avg-reliability">
              {metrics?.averageReliability ? `${metrics.averageReliability.toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Flight confidence score</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-efficiency">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Efficiency</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-employee-efficiency">
              {metrics?.employeeEfficiency ? `${metrics.employeeEfficiency.toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Error-free completion</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-food-saved">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Saved</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-food-saved">{metrics?.foodSaved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Meals reallocated</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employee Efficiency Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Efficiency %"
                  dot={{ fill: "hsl(var(--chart-1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bottle Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Bottle Action Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bottleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bottleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Food Saved Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Food Waste Prevention</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={foodSavedTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" name="Meals Saved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alert Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
              <div className="flex items-center gap-3">
                <Wine className="h-5 w-5 text-chart-2" />
                <div>
                  <p className="text-sm font-medium">Bottles Processed</p>
                  <p className="text-xs text-muted-foreground">Total analyzed today</p>
                </div>
              </div>
              <p className="text-xl font-bold font-mono">
                {(metrics?.bottlesReused || 0) + (metrics?.bottlesCombined || 0) + (metrics?.bottlesDiscarded || 0)}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-chart-5" />
                <div>
                  <p className="text-sm font-medium">Trolley Error Rate</p>
                  <p className="text-xs text-muted-foreground">Discrepancies detected</p>
                </div>
              </div>
              <p className="text-xl font-bold font-mono">
                {metrics?.trolleyErrorRate ? `${metrics.trolleyErrorRate.toFixed(1)}%` : "0%"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
