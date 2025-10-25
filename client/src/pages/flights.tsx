import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Cloud, Plane, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFlightSchema, type Flight, type InsertFlight, FlightStatus } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Flights() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: flights, isLoading } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const form = useForm<InsertFlight>({
    resolver: zodResolver(insertFlightSchema),
    defaultValues: {
      flightNumber: "",
      departureTime: new Date(),
      destination: "",
      airline: "",
      status: FlightStatus.SCHEDULED,
      plannedMeals: 0,
      plannedBottles: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFlight) => {
      return await apiRequest("POST", "/api/flights", data);
    },
    onSuccess: (flight: Flight) => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Flight Created Successfully",
        description: `${flight.flightNumber} to ${flight.destination} has been added to the system.`,
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

  const checkReliabilityMutation = useMutation({
    mutationFn: async (flightId: string) => {
      return await apiRequest("POST", `/api/flights/${flightId}/check-reliability`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      const reliability = data.reliability;
      const warningMessage = reliability < 70 ? " Weather risk detected." : "";
      toast({
        title: `Reliability: ${reliability.toFixed(0)}%`,
        description: `${data.recommendation}${warningMessage}`,
      });
    },
  });

  const onSubmit = (data: InsertFlight) => {
    createMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case FlightStatus.SCHEDULED:
        return <CheckCircle className="h-4 w-4" />;
      case FlightStatus.DELAYED:
        return <Clock className="h-4 w-4" />;
      case FlightStatus.CANCELLED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case FlightStatus.SCHEDULED:
        return "default";
      case FlightStatus.DELAYED:
        return "secondary";
      case FlightStatus.CANCELLED:
        return "destructive";
      default:
        return "default";
    }
  };

  const getReliabilityBadge = (reliability: number | null) => {
    if (reliability === null || reliability === undefined) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (reliability >= 80) {
      return <Badge className="bg-chart-2 text-white border-chart-2">High: {reliability.toFixed(0)}%</Badge>;
    }
    if (reliability >= 70) {
      return <Badge className="bg-chart-3 text-white border-chart-3">Medium: {reliability.toFixed(0)}%</Badge>;
    }
    return <Badge className="bg-chart-5 text-white border-chart-5">Low: {reliability.toFixed(0)}%</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading flights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Flight Management</h1>
          <p className="text-sm text-muted-foreground">Track flights with weather-based reliability scoring</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-flight">
              <Plus className="h-4 w-4 mr-2" />
              Add Flight
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Flight</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="flightNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flight Number</FormLabel>
                        <FormControl>
                          <Input placeholder="AMX245" data-testid="input-flight-number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="airline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Airline</FormLabel>
                        <FormControl>
                          <Input placeholder="AeroMexico" data-testid="input-airline" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="New York (JFK)" data-testid="input-destination" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departureTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            data-testid="input-departure-time"
                            value={field.value instanceof Date ? format(field.value, "yyyy-MM-dd'T'HH:mm") : field.value}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={FlightStatus.SCHEDULED}>Scheduled</SelectItem>
                            <SelectItem value={FlightStatus.DELAYED}>Delayed</SelectItem>
                            <SelectItem value={FlightStatus.CANCELLED}>Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plannedMeals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Meals</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-planned-meals"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plannedBottles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Bottles</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-planned-bottles"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-flight">
                    {createMutation.isPending ? "Creating..." : "Create Flight"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {flights && flights.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Plane className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Flights Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by creating your first flight</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Flight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {flights?.map((flight) => (
            <Card key={flight.id} data-testid={`card-flight-${flight.id}`} className="hover-elevate">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl font-bold font-mono">{flight.flightNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{flight.airline}</p>
                  </div>
                  <Badge variant={getStatusVariant(flight.status)} className="gap-1">
                    {getStatusIcon(flight.status)}
                    {flight.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reliability</span>
                  {getReliabilityBadge(flight.reliability)}
                </div>

                {flight.reliability !== null && flight.reliability < 70 && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-destructive">Low Reliability</p>
                      <p className="text-muted-foreground mt-1">Consider reducing fresh food load by 30%</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Destination</p>
                    <p className="text-sm font-medium">{flight.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Departure</p>
                    <p className="text-sm font-medium">{format(new Date(flight.departureTime), "MMM dd, HH:mm")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Meals</p>
                    <p className="text-sm font-medium font-mono">{flight.plannedMeals}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Bottles</p>
                    <p className="text-sm font-medium font-mono">{flight.plannedBottles}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => checkReliabilityMutation.mutate(flight.id)}
                  disabled={checkReliabilityMutation.isPending}
                  data-testid={`button-check-reliability-${flight.id}`}
                >
                  <Cloud className="h-3 w-3 mr-2" />
                  {checkReliabilityMutation.isPending ? "Checking..." : "Check Weather"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
