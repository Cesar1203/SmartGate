import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, TrendingUp, TrendingDown } from "lucide-react";
import type { EmployeeMetric } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Employees() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    avgPrepTime: "",
    errorRate: "",
    complianceRate: "",
    trolleysProcessed: "",
  });
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<EmployeeMetric[]>({
    queryKey: ["/api/metrics/employees"],
    refetchInterval: 5000,
  });

  const addMutation = useMutation({
    mutationFn: async (data: EmployeeMetric) => {
      return await apiRequest("POST", "/api/metrics/employees", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metrics/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setShowForm(false);
      setFormData({
        employeeName: "",
        avgPrepTime: "",
        errorRate: "",
        complianceRate: "",
        trolleysProcessed: "",
      });
      toast({
        title: "Employee added",
        description: "Employee performance data has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeName || !formData.avgPrepTime || !formData.errorRate || 
        !formData.complianceRate || !formData.trolleysProcessed) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate({
      employeeName: formData.employeeName,
      avgPrepTime: parseFloat(formData.avgPrepTime),
      errorRate: parseFloat(formData.errorRate),
      complianceRate: parseFloat(formData.complianceRate),
      trolleysProcessed: parseInt(formData.trolleysProcessed),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Performance</h1>
          <p className="text-sm text-muted-foreground">Track and manage employee metrics</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          data-testid="button-add-employee"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee Data
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Employee Performance Data</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input
                    id="employeeName"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    placeholder="Enter employee name"
                    data-testid="input-employee-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avgPrepTime">Average Prep Time (minutes)</Label>
                  <Input
                    id="avgPrepTime"
                    type="number"
                    step="0.1"
                    value={formData.avgPrepTime}
                    onChange={(e) => setFormData({ ...formData, avgPrepTime: e.target.value })}
                    placeholder="12.5"
                    data-testid="input-avg-prep-time"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="errorRate">Error Rate (%)</Label>
                  <Input
                    id="errorRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.errorRate}
                    onChange={(e) => setFormData({ ...formData, errorRate: e.target.value })}
                    placeholder="2.5"
                    data-testid="input-error-rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complianceRate">Compliance Rate (%)</Label>
                  <Input
                    id="complianceRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.complianceRate}
                    onChange={(e) => setFormData({ ...formData, complianceRate: e.target.value })}
                    placeholder="97.5"
                    data-testid="input-compliance-rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trolleysProcessed">Trolleys Processed</Label>
                  <Input
                    id="trolleysProcessed"
                    type="number"
                    min="0"
                    value={formData.trolleysProcessed}
                    onChange={(e) => setFormData({ ...formData, trolleysProcessed: e.target.value })}
                    placeholder="45"
                    data-testid="input-trolleys-processed"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addMutation.isPending}
                  data-testid="button-submit-employee"
                >
                  {addMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  data-testid="button-cancel-employee"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : employees && employees.length > 0 ? (
            <div className="space-y-3">
              {employees.map((employee, index) => (
                <div
                  key={index}
                  className="p-4 rounded-md border hover-elevate"
                  data-testid={`employee-${index}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold mb-3">{employee.employeeName}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Avg Prep Time</p>
                          <p className="text-sm font-medium">{employee.avgPrepTime.toFixed(1)} min</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium">{employee.errorRate.toFixed(1)}%</p>
                            {employee.errorRate < 3 ? (
                              <TrendingDown className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingUp className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Compliance</p>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium">{employee.complianceRate.toFixed(1)}%</p>
                            {employee.complianceRate > 95 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Trolleys</p>
                          <p className="text-sm font-medium">{employee.trolleysProcessed}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Badge
                      variant={employee.complianceRate > 95 && employee.errorRate < 3 ? "default" : "secondary"}
                      className="flex-shrink-0"
                    >
                      {employee.complianceRate > 95 && employee.errorRate < 3 ? "Excellent" : "Good"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No employee data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Employee Data" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
