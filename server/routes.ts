import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFlightSchema, insertAirlineRuleSchema, insertOrderSchema } from "@shared/schema";
import { analyzeBottleImage, verifyTrolleyImage } from "./openai";
import { getWeatherData, calculateFlightReliability, getReliabilityRecommendation } from "./weather";

export async function registerRoutes(app: Express): Promise<Server> {
  // Flight routes
  app.get("/api/flights", async (_req, res) => {
    try {
      const flights = await storage.getFlights();
      res.json(flights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flights" });
    }
  });

  app.get("/api/flights/:id", async (req, res) => {
    try {
      const flight = await storage.getFlight(req.params.id);
      if (!flight) {
        return res.status(404).json({ error: "Flight not found" });
      }
      res.json(flight);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flight" });
    }
  });

  app.post("/api/flights", async (req, res) => {
    try {
      const validated = insertFlightSchema.parse(req.body);
      const flight = await storage.createFlight(validated);
      res.status(201).json(flight);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid flight data" });
    }
  });

  app.post("/api/flights/:id/check-reliability", async (req, res) => {
    try {
      const flight = await storage.getFlight(req.params.id);
      if (!flight) {
        return res.status(404).json({ error: "Flight not found" });
      }

      const weather = await getWeatherData(flight.destination, new Date(flight.departureTime));
      const reliability = calculateFlightReliability(weather);
      const recommendation = getReliabilityRecommendation(reliability);

      const updated = await storage.updateFlight(flight.id, { reliability });

      res.json({
        flight: updated,
        weather,
        reliability,
        recommendation,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to check reliability" });
    }
  });

  app.patch("/api/flights/:id", async (req, res) => {
    try {
      const updated = await storage.updateFlight(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Flight not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update flight" });
    }
  });

  app.delete("/api/flights/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFlight(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Flight not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flight" });
    }
  });

  // Airline rules routes
  app.get("/api/rules", async (_req, res) => {
    try {
      const rules = await storage.getAirlineRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.post("/api/rules", async (req, res) => {
    try {
      const validated = insertAirlineRuleSchema.parse(req.body);
      const rule = await storage.createAirlineRule(validated);
      res.status(201).json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid rule data" });
    }
  });

  app.patch("/api/rules/:id", async (req, res) => {
    try {
      const updated = await storage.updateAirlineRule(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update rule" });
    }
  });

  // Bottle analysis routes
  app.get("/api/bottles/recent", async (_req, res) => {
    try {
      const analyses = await storage.getBottleAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bottle analyses" });
    }
  });

  app.post("/api/bottles/analyze", async (req, res) => {
    try {
      const { flightId, imageData } = req.body;

      if (!flightId || !imageData) {
        return res.status(400).json({ error: "Missing flightId or imageData" });
      }

      const flight = await storage.getFlight(flightId);
      if (!flight) {
        return res.status(404).json({ error: "Flight not found" });
      }

      // Get airline-specific rules or use defaults
      const airlineRule = await storage.getAirlineRule(flight.airline);
      const reuseThreshold = airlineRule?.reuseThreshold || 70;
      const combineThreshold = airlineRule?.combineThreshold || 40;

      // Analyze the image using OpenAI Vision
      const result = await analyzeBottleImage(imageData, reuseThreshold, combineThreshold);

      // Store the analysis
      const analysis = await storage.createBottleAnalysis({
        flightId,
        imageData,
        bottleType: result.bottleType,
        fillLevel: result.fillLevel,
        recommendedAction: result.recommendedAction,
        aiAnalysis: result.analysis,
      });

      res.status(201).json(analysis);
    } catch (error: any) {
      console.error("Bottle analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze bottle" });
    }
  });

  // Trolley verification routes
  app.get("/api/trolleys/recent", async (_req, res) => {
    try {
      const verifications = await storage.getTrolleyVerifications();
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trolley verifications" });
    }
  });

  app.post("/api/trolleys/verify", async (req, res) => {
    try {
      const { flightId, imageData, goldenLayoutName } = req.body;

      if (!flightId || !imageData) {
        return res.status(400).json({ error: "Missing flightId or imageData" });
      }

      const flight = await storage.getFlight(flightId);
      if (!flight) {
        return res.status(404).json({ error: "Flight not found" });
      }

      // Verify the image using OpenAI Vision
      const result = await verifyTrolleyImage(imageData);

      // Store the verification
      const verification = await storage.createTrolleyVerification({
        flightId,
        imageData,
        goldenLayoutName: goldenLayoutName || "Standard Layout",
        hasErrors: result.hasErrors ? 1 : 0,
        errors: result.errors,
        aiAnalysis: result.analysis,
      });

      res.status(201).json(verification);
    } catch (error: any) {
      console.error("Trolley verification error:", error);
      res.status(500).json({ error: error.message || "Failed to verify trolley" });
    }
  });

  // Metrics routes
  app.get("/api/metrics", async (_req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/metrics/efficiency-trend", async (_req, res) => {
    try {
      const trend = await storage.getEfficiencyTrend();
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch efficiency trend" });
    }
  });

  app.get("/api/metrics/food-saved-trend", async (_req, res) => {
    try {
      const trend = await storage.getFoodSavedTrend();
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch food saved trend" });
    }
  });

  app.get("/api/metrics/employees", async (_req, res) => {
    try {
      const employees = await storage.getEmployeeMetrics();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee metrics" });
    }
  });

  // Customer orders routes
  app.get("/api/orders", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/pending", async (_req, res) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validated = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validated);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid order data" });
    }
  });

  app.post("/api/orders/:id/complete", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "pending") {
        return res.status(400).json({ error: "Order must be pending to complete" });
      }

      const updated = await storage.updateOrderStatus(req.params.id, "in_verification");
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to complete order" });
    }
  });

  app.post("/api/orders/:id/verify", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.status !== "in_verification") {
        return res.status(400).json({ error: "Order must be in verification to verify" });
      }

      const updated = await storage.updateOrderStatus(req.params.id, "completed");
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to verify order" });
    }
  });

  app.post("/api/orders/:id/cancel", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const updated = await storage.updateOrderStatus(req.params.id, "cancelled");
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to cancel order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteOrder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Demo mode routes
  app.post("/api/demo/load", async (_req, res) => {
    try {
      await storage.loadDemoData();
      res.json({ success: true, message: "Demo data loaded successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load demo data" });
    }
  });

  app.post("/api/demo/clear", async (_req, res) => {
    try {
      await storage.clearAllData();
      res.json({ success: true, message: "All data cleared successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to clear data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
