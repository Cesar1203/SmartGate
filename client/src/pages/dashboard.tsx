import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, TrendingUp, Users, PackageCheck, Wine, AlertTriangle, Clock, Target, CheckCircle2, RefreshCw } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { DashboardMetrics, TrendData, EmployeeMetric } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: 3000, // Auto-refresh every 3 seconds for real-time updates
  });

  const reloadDemoDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/demo/load");
      return res;
    },
    onSuccess: () => {
      // Invalidate all queries to refresh all data
      queryClient.invalidateQueries();
      toast({
        title: "Demo data reloaded",
        description: "All demo data has been successfully reloaded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reload demo data",
        variant: "destructive",
      });
    },
  });

  const { data: efficiencyTrend } = useQuery<TrendData[]>({
    queryKey: ["/api/metrics/efficiency-trend"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: foodSavedTrend } = useQuery<TrendData[]>({
    queryKey: ["/api/metrics/food-saved-trend"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: employeeMetrics } = useQuery<EmployeeMetric[]>({
    queryKey: ["/api/metrics/employees"],
    refetchInterval: 10000, // Auto-refresh every 10 seconds
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time metrics and performance analytics</p>
        </div>
        <Button
          onClick={() => reloadDemoDataMutation.mutate()}
          disabled={reloadDemoDataMutation.isPending}
          variant="outline"
          className="gap-2"
          data-testid="button-reload-demo"
        >
          <RefreshCw className={`h-4 w-4 ${reloadDemoDataMutation.isPending ? 'animate-spin' : ''}`} />
          {reloadDemoDataMutation.isPending ? "Loading..." : "Reload Demo Data"}
        </Button>
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

      {/* Charts Grid - Only show when demo data is loaded */}
      {metrics && metrics.totalFlights > 0 && (
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
      )}

      {/* Employee Performance Metrics */}
      {employeeMetrics && employeeMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Employee</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg. Prep Time</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Error Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Compliance</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Trolleys / Week</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeMetrics.map((employee, index) => (
                    <tr key={index} className="border-b last:border-0 hover-elevate">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{employee.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono">{employee.avgPrepTime.toFixed(1)} min</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono ${employee.errorRate < 3 ? 'text-chart-2' : 'text-chart-5'}`}>
                          {employee.errorRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3 text-chart-2" />
                          <span className="font-mono text-chart-2">{employee.complianceRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono">{employee.trolleysProcessed}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
