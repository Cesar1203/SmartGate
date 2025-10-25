import {
  type Flight,
  type InsertFlight,
  type AirlineRule,
  type InsertAirlineRule,
  type BottleAnalysis,
  type InsertBottleAnalysis,
  type TrolleyVerification,
  type InsertTrolleyVerification,
  type Order,
  type InsertOrder,
  type DashboardMetrics,
  type TrendData,
  type EmployeeMetric,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Flight operations
  getFlights(): Promise<Flight[]>;
  getFlight(id: string): Promise<Flight | undefined>;
  createFlight(flight: InsertFlight): Promise<Flight>;
  updateFlight(id: string, data: Partial<Flight>): Promise<Flight | undefined>;
  deleteFlight(id: string): Promise<boolean>;

  // Airline rules operations
  getAirlineRules(): Promise<AirlineRule[]>;
  getAirlineRule(airline: string): Promise<AirlineRule | undefined>;
  createAirlineRule(rule: InsertAirlineRule): Promise<AirlineRule>;
  updateAirlineRule(id: string, data: Partial<AirlineRule>): Promise<AirlineRule | undefined>;

  // Bottle analysis operations
  getBottleAnalyses(): Promise<BottleAnalysis[]>;
  createBottleAnalysis(analysis: InsertBottleAnalysis): Promise<BottleAnalysis>;

  // Trolley verification operations
  getTrolleyVerifications(): Promise<TrolleyVerification[]>;
  createTrolleyVerification(verification: InsertTrolleyVerification): Promise<TrolleyVerification>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Metrics
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getEfficiencyTrend(): Promise<TrendData[]>;
  getFoodSavedTrend(): Promise<TrendData[]>;
  getEmployeeMetrics(): Promise<EmployeeMetric[]>;

  // Demo mode
  loadDemoData(): Promise<void>;
  clearAllData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private flights: Map<string, Flight>;
  private airlineRules: Map<string, AirlineRule>;
  private bottleAnalyses: BottleAnalysis[];
  private trolleyVerifications: TrolleyVerification[];
  private orders: Map<string, Order>;

  constructor() {
    this.flights = new Map();
    this.airlineRules = new Map();
    this.bottleAnalyses = [];
    this.trolleyVerifications = [];
    this.orders = new Map();
  }

  // Flight operations
  async getFlights(): Promise<Flight[]> {
    return Array.from(this.flights.values()).sort(
      (a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
    );
  }

  async getFlight(id: string): Promise<Flight | undefined> {
    return this.flights.get(id);
  }

  async createFlight(insertFlight: InsertFlight): Promise<Flight> {
    const id = randomUUID();
    const flight: Flight = {
      id,
      flightNumber: insertFlight.flightNumber,
      departureTime: insertFlight.departureTime,
      destination: insertFlight.destination,
      airline: insertFlight.airline,
      status: insertFlight.status as any,
      reliability: null,
      plannedMeals: insertFlight.plannedMeals || 0,
      plannedBottles: insertFlight.plannedBottles || 0,
      actualMeals: null,
      actualBottles: null,
    };
    this.flights.set(id, flight);
    return flight;
  }

  async updateFlight(id: string, data: Partial<Flight>): Promise<Flight | undefined> {
    const flight = this.flights.get(id);
    if (!flight) return undefined;

    const updated = { ...flight, ...data };
    this.flights.set(id, updated);
    return updated;
  }

  async deleteFlight(id: string): Promise<boolean> {
    return this.flights.delete(id);
  }

  // Airline rules operations
  async getAirlineRules(): Promise<AirlineRule[]> {
    return Array.from(this.airlineRules.values());
  }

  async getAirlineRule(airline: string): Promise<AirlineRule | undefined> {
    return Array.from(this.airlineRules.values()).find((rule) => rule.airline === airline);
  }

  async createAirlineRule(insertRule: InsertAirlineRule): Promise<AirlineRule> {
    const id = randomUUID();
    const rule: AirlineRule = {
      id,
      airline: insertRule.airline,
      reuseThreshold: insertRule.reuseThreshold || 70,
      combineThreshold: insertRule.combineThreshold || 40,
    };
    this.airlineRules.set(id, rule);
    return rule;
  }

  async updateAirlineRule(id: string, data: Partial<AirlineRule>): Promise<AirlineRule | undefined> {
    const rule = this.airlineRules.get(id);
    if (!rule) return undefined;

    const updated = { ...rule, ...data };
    this.airlineRules.set(id, updated);
    return updated;
  }

  // Bottle analysis operations
  async getBottleAnalyses(): Promise<BottleAnalysis[]> {
    return [...this.bottleAnalyses].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createBottleAnalysis(insertAnalysis: InsertBottleAnalysis): Promise<BottleAnalysis> {
    const id = randomUUID();
    const analysis: BottleAnalysis = {
      id,
      flightId: insertAnalysis.flightId ?? null,
      imageData: insertAnalysis.imageData ?? null,
      bottleType: insertAnalysis.bottleType ?? null,
      fillLevel: insertAnalysis.fillLevel ?? null,
      recommendedAction: (insertAnalysis.recommendedAction as "reuse" | "combine" | "discard" | null) ?? null,
      aiAnalysis: insertAnalysis.aiAnalysis ?? null,
      timestamp: new Date(),
    };
    this.bottleAnalyses.push(analysis);
    return analysis;
  }

  // Trolley verification operations
  async getTrolleyVerifications(): Promise<TrolleyVerification[]> {
    return [...this.trolleyVerifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createTrolleyVerification(insertVerification: InsertTrolleyVerification): Promise<TrolleyVerification> {
    const id = randomUUID();
    const verification: TrolleyVerification = {
      id,
      flightId: insertVerification.flightId ?? null,
      imageData: insertVerification.imageData ?? null,
      aiAnalysis: insertVerification.aiAnalysis ?? null,
      goldenLayoutName: insertVerification.goldenLayoutName ?? null,
      hasErrors: insertVerification.hasErrors || 0,
      errors: insertVerification.errors as string[] | null ?? null,
      timestamp: new Date(),
    };
    this.trolleyVerifications.push(verification);
    return verification;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      id,
      flightNumber: insertOrder.flightNumber,
      airline: insertOrder.airline,
      departureTime: insertOrder.departureTime,
      destination: insertOrder.destination,
      requestedProducts: insertOrder.requestedProducts,
      status: (insertOrder.status as any) || "pending",
      reliability: insertOrder.reliability ?? null,
      weatherData: insertOrder.weatherData ?? null,
      recommendations: insertOrder.recommendations ?? null,
      adjustedProducts: insertOrder.adjustedProducts ?? null,
      timestamp: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updated = { ...order, ...data };
    this.orders.set(id, updated);
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const flights = await this.getFlights();
    const bottleAnalyses = await this.getBottleAnalyses();
    const trolleyVerifications = await this.getTrolleyVerifications();

    const totalFlights = flights.length;
    const flightsWithReliability = flights.filter((f) => f.reliability !== null);
    const averageReliability =
      flightsWithReliability.length > 0
        ? flightsWithReliability.reduce((sum, f) => sum + (f.reliability || 0), 0) / flightsWithReliability.length
        : 0;

    const trolleyErrors = trolleyVerifications.filter((v) => v.hasErrors).length;
    const trolleyErrorRate = trolleyVerifications.length > 0 ? (trolleyErrors / trolleyVerifications.length) * 100 : 0;

    const bottlesReused = bottleAnalyses.filter((a) => a.recommendedAction === "reuse").length;
    const bottlesCombined = bottleAnalyses.filter((a) => a.recommendedAction === "combine").length;
    const bottlesDiscarded = bottleAnalyses.filter((a) => a.recommendedAction === "discard").length;

    const totalBottleActions = bottleAnalyses.length;
    const successfulActions = totalBottleActions - bottlesDiscarded;
    const employeeEfficiency = totalBottleActions > 0 ? (successfulActions / totalBottleActions) * 100 : 100;

    const delayedFlights = flights.filter((f) => f.status === "delayed" || f.status === "cancelled");
    const foodSaved = delayedFlights.reduce((sum, f) => sum + (f.plannedMeals || 0), 0);

    return {
      totalFlights,
      averageReliability,
      employeeEfficiency,
      foodSaved,
      bottlesReused,
      bottlesCombined,
      bottlesDiscarded,
      trolleyErrorRate,
    };
  }

  async getEfficiencyTrend(): Promise<TrendData[]> {
    // Return fixed demo trend data for consistent demo mode
    const { demoEfficiencyTrend } = await import("@shared/demo-data");
    return demoEfficiencyTrend;
  }

  async getFoodSavedTrend(): Promise<TrendData[]> {
    // Return fixed demo trend data for consistent demo mode
    const { demoFoodSavedTrend } = await import("@shared/demo-data");
    return demoFoodSavedTrend;
  }

  async getEmployeeMetrics(): Promise<EmployeeMetric[]> {
    // Return demo employee metrics
    const { demoEmployeeMetrics } = await import("@shared/demo-data");
    return demoEmployeeMetrics;
  }

  async loadDemoData(): Promise<void> {
    // Clear existing data
    await this.clearAllData();

    // Load demo data
    const { demoFlights, demoRules, demoBottleAnalyses, demoTrolleyVerifications } = await import("@shared/demo-data");

    // Add demo flights and collect IDs
    const flightIds: string[] = [];
    for (const flight of demoFlights) {
      const id = randomUUID();
      this.flights.set(id, { ...flight, id } as Flight);
      flightIds.push(id);
    }

    // Add demo rules
    for (const rule of demoRules) {
      const id = randomUUID();
      this.airlineRules.set(id, { ...rule, id });
    }

    // Add demo bottle analyses linked to flights
    for (let i = 0; i < demoBottleAnalyses.length; i++) {
      const analysis = demoBottleAnalyses[i];
      const flightId = flightIds[i % flightIds.length]; // Distribute across flights
      this.bottleAnalyses.push({
        ...analysis,
        id: randomUUID(),
        flightId,
        timestamp: new Date(),
      });
    }

    // Add demo trolley verifications linked to flights
    for (let i = 0; i < demoTrolleyVerifications.length; i++) {
      const verification = demoTrolleyVerifications[i];
      const flightId = flightIds[i % flightIds.length]; // Distribute across flights
      this.trolleyVerifications.push({
        ...verification,
        id: randomUUID(),
        flightId,
        timestamp: new Date(),
      });
    }
  }

  async clearAllData(): Promise<void> {
    this.flights.clear();
    this.airlineRules.clear();
    this.bottleAnalyses = [];
    this.trolleyVerifications = [];
    this.orders.clear();
  }
}

export const storage = new MemStorage();
