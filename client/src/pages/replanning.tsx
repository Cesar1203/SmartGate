import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Package, Clock, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { Flight, Reassignment } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Replanning() {
  const { toast } = useToast();
  
  const { data: flights, isLoading } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const { data: reassignments, isLoading: reassignmentsLoading } = useQuery<Reassignment[]>({
    queryKey: ["/api/reassignments"],
    refetchInterval: 5000,
  });

  const processReassignmentsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reassignments/process");
      return res.json() as Promise<{ reassignments: Reassignment[]; processed: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reassignments"] });
      toast({
        title: "Reassignments processed",
        description: `Processed ${data.processed} affected flights`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process reassignments",
        variant: "destructive",
      });
    },
  });

  const reassignToOrderMutation = useMutation({
    mutationFn: async ({ fromFlight, toFlight }: { fromFlight: Flight; toFlight: Flight }) => {
      // Create pending order for the target flight with reassigned resources
      const orderData = {
        flightNumber: toFlight.flightNumber,
        airline: toFlight.airline,
        destination: toFlight.destination,
        departureTime: toFlight.departureTime,
        mealsRequested: fromFlight.plannedMeals || 0,
        snacksRequested: 0,
        beveragesRequested: fromFlight.plannedBottles || 0,
        status: "pending",
      };
      
      // Create the pending order
      await apiRequest("POST", "/api/orders", orderData);
      
      // Update the delayed flight status to 'reassigned' so it doesn't show in replanning anymore
      const patchRes = await apiRequest("PATCH", `/api/flights/${fromFlight.id}`, { status: "reassigned" });
      
      return patchRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      toast({
        title: "Reassignment successful",
        description: "Resources moved to pending orders",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create reassignment order",
        variant: "destructive",
      });
    },
  });

  const delayedFlights = flights?.filter((f) => f.status === "delayed" || f.status === "cancelled") || [];
  const scheduledFlights = flights?.filter((f) => f.status === "scheduled") || [];

  // Extract airline code from flight number
  const extractAirlineCode = (flightNumber: string): string => {
    const match = flightNumber.match(/^([A-Z]{2,3})/);
    return match ? match[1] : "";
  };

  // Get compatible flights for a delayed flight (same airline only)
  const getCompatibleFlights = (delayedFlight: Flight): Flight[] => {
    const delayedAirlineCode = extractAirlineCode(delayedFlight.flightNumber);
    return scheduledFlights.filter((f) => {
      const flightAirlineCode = extractAirlineCode(f.flightNumber);
      return flightAirlineCode === delayedAirlineCode;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "no_flight":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">🟢 Success</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1">🟡 Pending</Badge>;
      case "no_flight":
        return <Badge variant="destructive" className="gap-1">🔴 No Flight</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Flight Replanning</h1>
        <p className="text-sm text-muted-foreground">Reassign resources when flight schedules change</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading replanning data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {delayedFlights.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Delayed Flights Requiring Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {delayedFlights.map((flight) => (
                    <div
                      key={flight.id}
                      className="p-4 rounded-md border bg-card space-y-3"
                      data-testid={`delayed-flight-${flight.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-mono text-lg font-bold">{flight.flightNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {flight.airline} → {flight.destination}
                          </p>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Delayed
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Original: {format(new Date(flight.departureTime), "MMM dd, HH:mm")}</span>
                      </div>

                      <div className="p-3 rounded-md bg-muted/50 space-y-2">
                        <p className="text-sm font-medium">Available Actions:</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            <span>{flight.plannedMeals} meals can be reassigned to compatible flights</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            <span>{flight.plannedBottles} bottles available for reallocation</span>
                          </li>
                        </ul>
                      </div>

                      {(() => {
                        const compatibleFlights = getCompatibleFlights(flight);
                        return compatibleFlights.length > 0 ? (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-2">Suggested Reassignments:</p>
                            <div className="space-y-2">
                              {compatibleFlights.slice(0, 2).map((targetFlight) => (
                                <div
                                  key={targetFlight.id}
                                  className="flex items-center justify-between p-2 rounded-md bg-background/50"
                                >
                                  <div className="flex items-center gap-2 text-sm">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono font-medium">{targetFlight.flightNumber}</span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(targetFlight.departureTime), "HH:mm")}
                                    </span>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => reassignToOrderMutation.mutate({ fromFlight: flight, toFlight: targetFlight })}
                                    disabled={reassignToOrderMutation.isPending}
                                    data-testid={`button-reassign-${targetFlight.id}`}
                                  >
                                    {reassignToOrderMutation.isPending ? "Processing..." : "Reassign"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-2 text-yellow-600 dark:text-yellow-400">
                              ⚠️ No compatible same-airline flights available
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Food can only be reassigned to flights of the same airline
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Process Reassignments Button */}
              {delayedFlights.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={() => processReassignmentsMutation.mutate()}
                      disabled={processReassignmentsMutation.isPending}
                      className="w-full gap-2"
                      data-testid="button-process-reassignments"
                    >
                      <RefreshCw className={`h-4 w-4 ${processReassignmentsMutation.isPending ? 'animate-spin' : ''}`} />
                      {processReassignmentsMutation.isPending ? "Processing..." : "Process Reassignments"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Replanning Needed</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  All flights are on schedule. Delayed flights will appear here for resource reassignment.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reassignment Logs */}
          {reassignments && reassignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Reassignment History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reassignments.map((reassignment) => (
                  <div
                    key={reassignment.id}
                    className="p-4 rounded-md border bg-card space-y-2"
                    data-testid={`reassignment-${reassignment.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reassignment.status)}
                        <span className="font-mono font-medium">{reassignment.fromFlightNumber}</span>
                        {reassignment.toFlightNumber && (
                          <>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-medium">{reassignment.toFlightNumber}</span>
                          </>
                        )}
                        <span className="text-sm text-muted-foreground">({reassignment.airline})</span>
                      </div>
                      {getStatusBadge(reassignment.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{reassignment.reason}</p>
                    
                    {reassignment.status === "success" && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{reassignment.mealsReassigned} meals</span>
                        <span>{reassignment.bottlesReassigned} bottles</span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {format(new Date(reassignment.timestamp), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Replanning Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Reassignment Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Airline Restriction</h4>
                  <p className="text-sm text-muted-foreground">
                    Fresh food can only be reassigned between flights of the <strong>same airline</strong>. 
                    Food is never reassigned between different airlines (e.g., AeroMexico meals cannot go to Delta flights).
                  </p>
                </div>

                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Priority Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Only flights from the same airline (IATA code)</li>
                    <li>• Flights departing within 6 hours</li>
                    <li>• Priority to the closest departure time</li>
                    <li>• If no compatible flight → mark as "Expiring"</li>
                  </ul>
                </div>

                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Status Indicators</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>🟢 <strong>Success</strong> - Reassignment completed (same airline)</li>
                    <li>🟡 <strong>Pending</strong> - Awaiting confirmation</li>
                    <li>🔴 <strong>No Flight</strong> - No compatible flight available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
