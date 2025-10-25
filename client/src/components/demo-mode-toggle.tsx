import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DemoModeToggle() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadDemoMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/demo/load", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Demo Mode Activated",
        description: "Sample flights, rules, and metrics have been loaded for demonstration.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load demo data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/demo/clear", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Data Cleared",
        description: "All data has been reset. You can start fresh or load demo data.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-demo-mode">
          <Play className="h-4 w-4 mr-2" />
          Demo Mode
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo Mode</DialogTitle>
          <DialogDescription>
            Load sample data for hackathon presentation or clear all data to start fresh.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Load Demo Data</h4>
            <p className="text-sm text-muted-foreground">
              Loads sample flights with varying reliability scores (85%, 60%, 45%), airline rules, and employee metrics.
            </p>
            <Button
              onClick={() => loadDemoMutation.mutate()}
              disabled={loadDemoMutation.isPending}
              className="w-full"
              data-testid="button-load-demo"
            >
              <Play className="h-4 w-4 mr-2" />
              {loadDemoMutation.isPending ? "Loading..." : "Load Demo Data"}
            </Button>
          </div>
          <div className="border-t pt-4 space-y-2">
            <h4 className="text-sm font-medium">Clear All Data</h4>
            <p className="text-sm text-muted-foreground">
              Removes all flights, rules, and analyses to start with a clean slate.
            </p>
            <Button
              onClick={() => clearDataMutation.mutate()}
              disabled={clearDataMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-clear-data"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {clearDataMutation.isPending ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
