import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Cloud, AlertCircle, CheckCircle, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, type Order, type InsertOrder, type OrderRecommendation } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Orders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<OrderRecommendation | null>(null);
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 3000,
  });

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      flightNumber: "",
      airline: "",
      departureTime: new Date(),
      destination: "",
      requestedProducts: {
        meals: 0,
        snacks: 0,
        beverages: 0,
      },
      status: "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      return await apiRequest("POST", "/api/orders", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setCurrentRecommendation(response.recommendation);
      form.reset();
      toast({
        title: "Pedido Creado",
        description: `Pedido para vuelo ${response.order.flightNumber} procesado con recomendaciones.`,
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

  const confirmMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("POST", `/api/orders/${orderId}/confirm`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Pedido Confirmado",
        description: "El pedido ha sido confirmado y enviado para procesamiento.",
      });
    },
  });

  const onSubmit = (data: InsertOrder) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      adjusted: { label: "Ajustado", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const getRiskBadge = (reliability: number | null) => {
    if (!reliability) return null;
    if (reliability >= 80) {
      return <Badge className="bg-chart-2 text-white" data-testid="badge-risk-low">Riesgo Bajo: {reliability.toFixed(0)}%</Badge>;
    }
    if (reliability >= 60) {
      return <Badge className="bg-chart-3 text-white" data-testid="badge-risk-moderate">Riesgo Moderado: {reliability.toFixed(0)}%</Badge>;
    }
    return <Badge className="bg-chart-5 text-white" data-testid="badge-risk-high">Riesgo Alto: {reliability.toFixed(0)}%</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground" data-testid="heading-orders">Portal de Pedidos para Clientes</h2>
          <p className="text-muted-foreground mt-1">
            Solicite productos con recomendaciones basadas en clima y confiabilidad
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-order">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Nuevo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Solicitar Productos para Vuelo</DialogTitle>
              <DialogDescription>
                Complete la información del vuelo y cantidades de productos. El sistema calculará automáticamente recomendaciones basadas en clima.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="flightNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Vuelo</FormLabel>
                        <FormControl>
                          <Input placeholder="AA123" {...field} data-testid="input-flight-number" />
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
                        <FormLabel>Aerolínea</FormLabel>
                        <FormControl>
                          <Input placeholder="American Airlines" {...field} data-testid="input-airline" />
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
                        <FormLabel>Destino</FormLabel>
                        <FormControl>
                          <Input placeholder="Dallas (DFW)" {...field} data-testid="input-destination" />
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
                        <FormLabel>Fecha y Hora de Salida</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value instanceof Date ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-departure-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Cantidad de Productos Solicitados</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="requestedProducts.meals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comidas Frescas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-meals"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requestedProducts.snacks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Snacks</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-snacks"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requestedProducts.beverages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bebidas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-beverages"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-order">
                    {createMutation.isPending ? "Procesando..." : "Solicitar Pedido"}
                  </Button>
                </div>
              </form>
            </Form>

            {currentRecommendation && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Cloud className="h-5 w-5 text-chart-3 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Recomendación Basada en Clima</h4>
                    <p className="text-sm text-muted-foreground mb-3">{currentRecommendation.message}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Confiabilidad</p>
                        <p className="text-lg font-semibold">{currentRecommendation.reliability.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ajuste Sugerido</p>
                        <p className="text-lg font-semibold">-{currentRecommendation.adjustmentPercentage}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Comidas</p>
                        <p className="font-semibold">{currentRecommendation.suggestedProducts.meals}</p>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Snacks</p>
                        <p className="font-semibold">{currentRecommendation.suggestedProducts.snacks}</p>
                      </div>
                      <div className="p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Bebidas</p>
                        <p className="font-semibold">{currentRecommendation.suggestedProducts.beverages}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {orders && orders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">No hay pedidos</p>
              <p className="text-sm text-muted-foreground">Cree su primer pedido para comenzar</p>
            </CardContent>
          </Card>
        )}

        {orders?.map((order) => (
          <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">Vuelo {order.flightNumber}</CardTitle>
                    {getStatusBadge(order.status)}
                    {order.reliability && getRiskBadge(order.reliability)}
                  </div>
                  <CardDescription>
                    {order.airline} → {order.destination}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Salida</p>
                  <p className="font-semibold">{format(new Date(order.departureTime), "dd MMM yyyy")}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(order.departureTime), "HH:mm")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Productos Solicitados
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comidas:</span>
                      <span className="font-medium">{order.requestedProducts.meals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Snacks:</span>
                      <span className="font-medium">{order.requestedProducts.snacks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bebidas:</span>
                      <span className="font-medium">{order.requestedProducts.beverages}</span>
                    </div>
                  </div>
                </div>

                {order.adjustedProducts && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-chart-3" />
                      Productos Ajustados (Recomendado)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comidas:</span>
                        <span className="font-medium text-chart-3">
                          {order.adjustedProducts.meals}
                          {order.adjustedProducts.meals < order.requestedProducts.meals && (
                            <span className="text-xs ml-1">
                              (-{order.requestedProducts.meals - order.adjustedProducts.meals})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Snacks:</span>
                        <span className="font-medium">{order.adjustedProducts.snacks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bebidas:</span>
                        <span className="font-medium">{order.adjustedProducts.beverages}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {order.recommendations && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{order.recommendations}</span>
                  </p>
                </div>
              )}

              {order.weatherData && (
                <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Clima:</span>
                    <span className="font-medium">{order.weatherData.conditions}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="font-medium ml-1">{order.weatherData.temperature}°C</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Viento:</span>
                    <span className="font-medium ml-1">{order.weatherData.windSpeed} km/h</span>
                  </div>
                </div>
              )}

              {order.status === "pending" && (
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button
                    onClick={() => confirmMutation.mutate(order.id)}
                    disabled={confirmMutation.isPending}
                    data-testid={`button-confirm-${order.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Pedido
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
