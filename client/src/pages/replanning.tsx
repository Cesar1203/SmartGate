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
      return res as { reassignments: Reassignment[]; processed: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reassignments"] });
      toast({
        title: "Reasignaciones procesadas",
        description: `Se procesaron ${data.processed} vuelos afectados`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron procesar las reasignaciones",
        variant: "destructive",
      });
    },
  });

  const delayedFlights = flights?.filter((f) => f.status === "delayed" || f.status === "cancelled") || [];
  const scheduledFlights = flights?.filter((f) => f.status === "scheduled") || [];

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
        return <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">🟢 Exitoso</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1">🟡 Pendiente</Badge>;
      case "no_flight":
        return <Badge variant="destructive" className="gap-1">🔴 Sin Vuelo</Badge>;
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
                      {processReassignmentsMutation.isPending ? "Procesando..." : "Procesar Reasignaciones"}
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
                <CardTitle className="text-lg font-semibold">Historial de Reasignaciones</CardTitle>
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
                        <span>{reassignment.mealsReassigned} comidas</span>
                        <span>{reassignment.bottlesReassigned} botellas</span>
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
              <CardTitle className="text-lg font-semibold">Reglas de Reasignación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Restricción de Aerolínea</h4>
                  <p className="text-sm text-muted-foreground">
                    Los alimentos frescos solo se reasignan entre vuelos de la <strong>misma aerolínea</strong>. 
                    Nunca se reasignan alimentos entre aerolíneas diferentes (e.g., comidas de AM245 no pueden ir a DL321).
                  </p>
                </div>

                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Reglas de Prioridad</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Solo vuelos de la misma aerolínea (código IATA)</li>
                    <li>• Vuelos con salida dentro de 6 horas</li>
                    <li>• Prioridad al vuelo con salida más cercana</li>
                    <li>• Si no hay vuelo compatible → marcar como "Expirando"</li>
                  </ul>
                </div>

                <div className="p-4 rounded-md bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2">Indicadores de Estado</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>🟢 <strong>Exitoso</strong> - Reasignación completada (misma aerolínea)</li>
                    <li>🟡 <strong>Pendiente</strong> - Esperando confirmación</li>
                    <li>🔴 <strong>Sin Vuelo</strong> - No hay vuelo compatible disponible</li>
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
