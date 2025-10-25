import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Package, Clock } from "lucide-react";
import type { Flight } from "@shared/schema";
import { format } from "date-fns";

export default function Replanning() {
  const { data: flights, isLoading } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const delayedFlights = flights?.filter((f) => f.status === "delayed") || [];
  const scheduledFlights = flights?.filter((f) => f.status === "scheduled") || [];

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

                      {scheduledFlights.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-2">Suggested Reassignments:</p>
                          <div className="space-y-2">
                            {scheduledFlights.slice(0, 2).map((targetFlight) => (
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
                                <Button size="sm" variant="outline" data-testid={`button-reassign-${targetFlight.id}`}>
                                  Reassign
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
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

          {/* Replanning History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Replanning Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Automatic Resource Reallocation</h4>
                  <p className="text-sm text-muted-foreground">
                    When a flight is delayed or cancelled, the system identifies compatible flights for meal and bottle
                    reassignment based on departure time, destination compatibility, and expiration dates.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Priority Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Fresh meals reallocated first to prevent waste</li>
                    <li>• Flights departing within 6 hours get priority</li>
                    <li>• Same airline/destination preferred when possible</li>
                    <li>• Staff notifications sent automatically on reassignment</li>
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
