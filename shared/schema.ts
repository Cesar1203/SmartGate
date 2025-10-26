import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Flight statuses
export const FlightStatus = {
  SCHEDULED: "scheduled",
  DELAYED: "delayed",
  CANCELLED: "cancelled",
} as const;

export type FlightStatus = typeof FlightStatus[keyof typeof FlightStatus];

// Bottle actions
export const BottleAction = {
  REUSE: "reuse",
  COMBINE: "combine",
  DISCARD: "discard",
} as const;

export type BottleAction = typeof BottleAction[keyof typeof BottleAction];

// Flights table
export const flights = pgTable("flights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flightNumber: text("flight_number").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  destination: text("destination").notNull(),
  airline: text("airline").notNull(),
  status: text("status").notNull().$type<FlightStatus>(),
  reliability: real("reliability"), // percentage 0-100
  plannedMeals: integer("planned_meals").notNull().default(0),
  plannedBottles: integer("planned_bottles").notNull().default(0),
  actualMeals: integer("actual_meals"),
  actualBottles: integer("actual_bottles"),
});

export const insertFlightSchema = createInsertSchema(flights).omit({
  id: true,
}).extend({
  departureTime: z.coerce.date(),
});

export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flights.$inferSelect;

// Airline rules for bottle handling
export const airlineRules = pgTable("airline_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  airline: text("airline").notNull().unique(),
  reuseThreshold: integer("reuse_threshold").notNull().default(70), // >70% reuse
  combineThreshold: integer("combine_threshold").notNull().default(40), // 40-70% combine
  // <40% discard (implicit)
});

export const insertAirlineRuleSchema = createInsertSchema(airlineRules).omit({
  id: true,
});

export type InsertAirlineRule = z.infer<typeof insertAirlineRuleSchema>;
export type AirlineRule = typeof airlineRules.$inferSelect;

// Bottle analysis records
export const bottleAnalyses = pgTable("bottle_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flightId: varchar("flight_id").references(() => flights.id),
  imageData: text("image_data"), // base64 encoded
  fillLevel: integer("fill_level"), // percentage 0-100
  recommendedAction: text("recommended_action").$type<BottleAction>(),
  aiAnalysis: text("ai_analysis"), // raw AI response
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertBottleAnalysisSchema = createInsertSchema(bottleAnalyses).omit({
  id: true,
  timestamp: true,
});

export type InsertBottleAnalysis = z.infer<typeof insertBottleAnalysisSchema>;
export type BottleAnalysis = typeof bottleAnalyses.$inferSelect;

// Trolley verifications
export const trolleyVerifications = pgTable("trolley_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flightId: varchar("flight_id").references(() => flights.id),
  imageData: text("image_data"), // base64 encoded
  goldenLayoutName: text("golden_layout_name"),
  hasErrors: integer("has_errors").notNull().default(0), // 0 or 1 (boolean)
  errors: jsonb("errors").$type<string[]>(), // array of error descriptions
  aiAnalysis: text("ai_analysis"), // raw AI response
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertTrolleyVerificationSchema = createInsertSchema(trolleyVerifications).omit({
  id: true,
  timestamp: true,
});

export type InsertTrolleyVerification = z.infer<typeof insertTrolleyVerificationSchema>;
export type TrolleyVerification = typeof trolleyVerifications.$inferSelect;

// Weather data for flight reliability
export interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
  conditions: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalFlights: number;
  averageReliability: number;
  employeeEfficiency: number;
  foodSaved: number;
  bottlesReused: number;
  bottlesCombined: number;
  bottlesDiscarded: number;
  trolleyErrorRate: number;
}

// Employee metrics
export interface EmployeeMetric {
  employeeName: string;
  avgPrepTime: number;
  errorRate: number;
  complianceRate: number;
  trolleysProcessed: number;
}

// Chart data for trends
export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

// API response types
export interface BottleAnalysisResult {
  fillLevel: number;
  recommendedAction: BottleAction;
  analysis: string;
}

export interface TrolleyVerificationResult {
  hasErrors: boolean;
  errors: string[];
  analysis: string;
}

export interface FlightReliabilityResult {
  reliability: number;
  weather: WeatherData;
  recommendation: string;
}

// Reassignment statuses
export const ReassignmentStatus = {
  SUCCESS: "success",
  PENDING: "pending",
  NO_FLIGHT: "no_flight",
} as const;

export type ReassignmentStatus = typeof ReassignmentStatus[keyof typeof ReassignmentStatus];

// Reassignment logs table
export const reassignments = pgTable("reassignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromFlightNumber: text("from_flight_number").notNull(),
  toFlightNumber: text("to_flight_number"),
  airline: text("airline").notNull(),
  airlineCode: text("airline_code").notNull(),
  mealsReassigned: integer("meals_reassigned").notNull().default(0),
  bottlesReassigned: integer("bottles_reassigned").notNull().default(0),
  status: text("status").notNull().$type<ReassignmentStatus>(),
  reason: text("reason"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertReassignmentSchema = createInsertSchema(reassignments).omit({
  id: true,
  timestamp: true,
});

export type InsertReassignment = z.infer<typeof insertReassignmentSchema>;
export type Reassignment = typeof reassignments.$inferSelect;

// Order statuses for customer orders workflow
export const OrderStatus = {
  PENDING: "pending",
  IN_VERIFICATION: "in_verification",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Customer orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flightNumber: text("flight_number").notNull(),
  airline: text("airline").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  destination: text("destination").notNull(),
  mealsRequested: integer("meals_requested").notNull().default(0),
  snacksRequested: integer("snacks_requested").notNull().default(0),
  beveragesRequested: integer("beverages_requested").notNull().default(0),
  status: text("status").notNull().$type<OrderStatus>().default("pending"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  timestamp: true,
}).extend({
  departureTime: z.coerce.date(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
