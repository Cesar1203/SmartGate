import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema } from "@shared/schema";
import type { z } from "zod";

type InsertOrder = z.infer<typeof insertOrderSchema>;
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Plane, Package, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Orders() {
  const { toast } = useToast();
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);

  const { data: pendingOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/pending"],
    refetchInterval: 3000,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const form = useForm({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      flightNumber: "",
      airline: "",
      destination: "",
      departureTime: tomorrow,
      mealsRequested: 0,
      snacksRequested: 0,
      beveragesRequested: 0,
      status: "pending",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      form.reset();
      toast({
        title: "Pedido creado",
        description: "El pedido ha sido creado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive",
      });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/complete`, {});
      return res.json();
    },
    onSuccess: (order: Order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      setVerifyingOrder(order);
      toast({
        title: "Pedido completado",
        description: "El pedido está listo para verificación de trolley",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar el pedido",
        variant: "destructive",
      });
    },
  });

  const verifyOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/verify`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      setVerifyingOrder(null);
      toast({
        title: "Trolley verificado",
        description: "El pedido ha sido verificado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo verificar el pedido",
        variant: "destructive",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      setVerifyingOrder(null);
      toast({
        title: "Pedido cancelado",
        description: "El pedido ha sido cancelado",
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cancelar el pedido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createOrderMutation.mutate(data as InsertOrder);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" data-testid="badge-status-pending">Pendiente</Badge>;
      case "in_verification":
        return <Badge className="bg-blue-500 hover:bg-blue-600" data-testid="badge-status-verification">En Verificación</Badge>;
      case "completed":
        return <Badge variant="default" data-testid="badge-status-completed">Completado</Badge>;
      case "cancelled":
        return <Badge variant="destructive" data-testid="badge-status-cancelled">Cancelado</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-status-unknown">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos de Clientes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los pedidos de clientes y verifica trolleys
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Pedido</CardTitle>
            <CardDescription>
              Ingresa los detalles del pedido del cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                          <Input placeholder="AA1234" {...field} data-testid="input-flight-number" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-airline">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="American Airlines">American Airlines</SelectItem>
                            <SelectItem value="United Airlines">United Airlines</SelectItem>
                            <SelectItem value="Delta Airlines">Delta Airlines</SelectItem>
                            <SelectItem value="Southwest Airlines">Southwest Airlines</SelectItem>
                            <SelectItem value="Aeroméxico">Aeroméxico</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="Ciudad" {...field} data-testid="input-destination" />
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
                        <FormLabel>Hora de Salida</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={
                              field.value instanceof Date && !isNaN(field.value.getTime())
                                ? format(field.value, "yyyy-MM-dd'T'HH:mm")
                                : ""
                            }
                            onChange={(e) => {
                              const date = new Date(e.target.value);
                              if (!isNaN(date.getTime())) {
                                field.onChange(date);
                              }
                            }}
                            data-testid="input-departure-time"
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
                    name="mealsRequested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comidas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            value={field.value}
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
                    name="snacksRequested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Snacks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            value={field.value}
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
                    name="beveragesRequested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bebidas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-beverages"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  data-testid="button-create-order"
                >
                  {createOrderMutation.isPending ? "Creando..." : "Crear Pedido"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="w-96 border-l bg-muted/30 overflow-y-auto p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Pedidos Pendientes</h2>
            <p className="text-sm text-muted-foreground">
              {pendingOrders.length} pedido{pendingOrders.length !== 1 ? "s" : ""}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando pedidos...
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay pedidos pendientes
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4 text-primary" />
                            <span className="font-mono font-semibold" data-testid={`text-flight-${order.id}`}>
                              {order.flightNumber}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-airline-${order.id}`}>
                            {order.airline}
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(order.departureTime), "PPp")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>
                            {order.mealsRequested} comidas, {order.snacksRequested} snacks, {order.beveragesRequested} bebidas
                          </span>
                        </div>
                      </div>

                      {order.status === "pending" && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => completeOrderMutation.mutate(order.id)}
                          disabled={completeOrderMutation.isPending}
                          data-testid={`button-complete-${order.id}`}
                        >
                          {completeOrderMutation.isPending ? "Procesando..." : "Completar Pedido"}
                        </Button>
                      )}

                      {order.status === "in_verification" && (
                        <Button
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          size="sm"
                          onClick={() => setVerifyingOrder(order)}
                          data-testid={`button-verify-${order.id}`}
                        >
                          Verificar Trolley
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!verifyingOrder} onOpenChange={(open) => !open && setVerifyingOrder(null)}>
        <DialogContent data-testid="dialog-verify-trolley">
          <DialogHeader>
            <DialogTitle>Verificación de Trolley</DialogTitle>
            <DialogDescription>
              Confirma que el trolley para este pedido está correctamente preparado
            </DialogDescription>
          </DialogHeader>

          {verifyingOrder && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Vuelo:</span>
                  <span className="text-sm font-mono" data-testid="verify-flight-number">{verifyingOrder.flightNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Aerolínea:</span>
                  <span className="text-sm" data-testid="verify-airline">{verifyingOrder.airline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Destino:</span>
                  <span className="text-sm" data-testid="verify-destination">{verifyingOrder.destination}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Productos Solicitados:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comidas:</span>
                    <span data-testid="verify-meals">{verifyingOrder.mealsRequested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Snacks:</span>
                    <span data-testid="verify-snacks">{verifyingOrder.snacksRequested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bebidas:</span>
                    <span data-testid="verify-beverages">{verifyingOrder.beveragesRequested}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => verifyingOrder && cancelOrderMutation.mutate(verifyingOrder.id)}
              disabled={cancelOrderMutation.isPending}
              data-testid="button-cancel-order"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={() => verifyingOrder && verifyOrderMutation.mutate(verifyingOrder.id)}
              disabled={verifyOrderMutation.isPending}
              data-testid="button-verify-order"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verificado ✅
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
