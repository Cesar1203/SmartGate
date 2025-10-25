import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Settings, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAirlineRuleSchema, type AirlineRule, type InsertAirlineRule } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

export default function Rules() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: rules, isLoading } = useQuery<AirlineRule[]>({
    queryKey: ["/api/rules"],
  });

  const form = useForm<InsertAirlineRule>({
    resolver: zodResolver(insertAirlineRuleSchema),
    defaultValues: {
      airline: "",
      reuseThreshold: 70,
      combineThreshold: 40,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAirlineRule) => {
      return await apiRequest("POST", "/api/rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Rule created",
        description: "Airline rule has been configured successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AirlineRule> }) => {
      return await apiRequest("PATCH", `/api/rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule updated",
        description: "Airline rule has been updated successfully.",
      });
    },
  });

  const onSubmit = (data: InsertAirlineRule) => {
    createMutation.mutate(data);
  };

  const [editingRule, setEditingRule] = useState<AirlineRule | null>(null);
  const [reuseValue, setReuseValue] = useState(70);
  const [combineValue, setCombineValue] = useState(40);

  const handleEditRule = (rule: AirlineRule) => {
    setEditingRule(rule);
    setReuseValue(rule.reuseThreshold);
    setCombineValue(rule.combineThreshold);
  };

  const handleSaveEdit = () => {
    if (editingRule) {
      updateMutation.mutate({
        id: editingRule.id,
        data: {
          reuseThreshold: reuseValue,
          combineThreshold: combineValue,
        },
      });
      setEditingRule(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Airline Rules</h1>
          <p className="text-sm text-muted-foreground">Configure bottle handling thresholds per airline</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-rule">
              <Plus className="h-4 w-4 mr-2" />
              Add Airline Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Airline Rule</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="airline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airline Name</FormLabel>
                      <FormControl>
                        <Input placeholder="AeroMexico" data-testid="input-airline-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reuseThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reuse Threshold (%)</FormLabel>
                      <FormDescription>Bottles above this fill level will be reused</FormDescription>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[Number(field.value)]}
                            onValueChange={(value) => field.onChange(Number(value[0]))}
                            data-testid="slider-reuse-threshold"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="font-medium text-foreground">{field.value}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="combineThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combine Threshold (%)</FormLabel>
                      <FormDescription>Bottles above this level (but below reuse) will be combined</FormDescription>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[Number(field.value)]}
                            onValueChange={(value) => field.onChange(Number(value[0]))}
                            data-testid="slider-combine-threshold"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="font-medium text-foreground">{field.value}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-3 rounded-md bg-muted/50 text-sm space-y-1">
                  <p className="font-medium">Rule Summary:</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>• &gt;{form.watch("reuseThreshold")}% → Reuse</li>
                    <li>
                      • {form.watch("combineThreshold")}%–{form.watch("reuseThreshold")}% → Combine
                    </li>
                    <li>• &lt;{form.watch("combineThreshold")}% → Discard</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-rule">
                    {createMutation.isPending ? "Creating..." : "Create Rule"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {rules && rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Airline Rules</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first airline rule to get started</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Airline Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules?.map((rule) => (
            <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{rule.airline}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingRule?.id === rule.id ? (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Reuse Threshold</label>
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[reuseValue]}
                          onValueChange={(value) => setReuseValue(Number(value[0]))}
                          data-testid={`slider-edit-reuse-${rule.id}`}
                        />
                        <p className="text-xs text-muted-foreground mt-1">&gt;{reuseValue}% → Reuse</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Combine Threshold</label>
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[combineValue]}
                          onValueChange={(value) => setCombineValue(Number(value[0]))}
                          data-testid={`slider-edit-combine-${rule.id}`}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {combineValue}%–{reuseValue}% → Combine
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        className="flex-1"
                        data-testid={`button-save-${rule.id}`}
                      >
                        <Save className="h-3 w-3 mr-2" />
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingRule(null)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-md bg-chart-2/10">
                        <span className="text-sm">Reuse</span>
                        <span className="text-sm font-mono font-medium">&gt;{rule.reuseThreshold}%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-chart-3/10">
                        <span className="text-sm">Combine</span>
                        <span className="text-sm font-mono font-medium">
                          {rule.combineThreshold}%–{rule.reuseThreshold}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-chart-5/10">
                        <span className="text-sm">Discard</span>
                        <span className="text-sm font-mono font-medium">&lt;{rule.combineThreshold}%</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEditRule(rule)}
                      data-testid={`button-edit-${rule.id}`}
                    >
                      Edit Thresholds
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
