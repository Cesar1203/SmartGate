import type { Flight, AirlineRule, EmployeeMetric, BottleAnalysis, TrolleyVerification, TrendData } from "./schema";

export const demoFlights: Omit<Flight, "id">[] = [
  {
    flightNumber: "AM651",
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    destination: "New York (JFK)",
    airline: "AeroMexico",
    status: "scheduled",
    plannedMeals: 180,
    plannedBottles: 90,
    reliability: 85,
    actualMeals: null,
    actualBottles: null,
  },
  {
    flightNumber: "AM245",
    departureTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    destination: "Mexico City (MEX)",
    airline: "AeroMexico",
    status: "delayed",
    plannedMeals: 160,
    plannedBottles: 80,
    reliability: 50,
    actualMeals: null,
    actualBottles: null,
  },
  {
    flightNumber: "AM892",
    departureTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    destination: "Guadalajara (GDL)",
    airline: "AeroMexico",
    status: "scheduled",
    plannedMeals: 140,
    plannedBottles: 70,
    reliability: 88,
    actualMeals: null,
    actualBottles: null,
  },
  {
    flightNumber: "UA1234",
    departureTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    destination: "Los Angeles (LAX)",
    airline: "United",
    status: "scheduled",
    plannedMeals: 220,
    plannedBottles: 110,
    reliability: 60,
    actualMeals: null,
    actualBottles: null,
  },
  {
    flightNumber: "AA789",
    departureTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
    destination: "Miami (MIA)",
    airline: "American Airlines",
    status: "delayed",
    plannedMeals: 150,
    plannedBottles: 75,
    reliability: 45,
    actualMeals: null,
    actualBottles: null,
  },
  {
    flightNumber: "AA456",
    departureTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000), // 3.5 hours from now
    destination: "Dallas (DFW)",
    airline: "American Airlines",
    status: "scheduled",
    plannedMeals: 190,
    plannedBottles: 95,
    reliability: 78,
    actualMeals: null,
    actualBottles: null,
  },
  {
    flightNumber: "DL456",
    departureTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    destination: "Atlanta (ATL)",
    airline: "Delta",
    status: "scheduled",
    plannedMeals: 200,
    plannedBottles: 100,
    reliability: 92,
    actualMeals: null,
    actualBottles: null,
  },
  {
    flightNumber: "DL321",
    departureTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours from now
    destination: "Detroit (DTW)",
    airline: "Delta",
    status: "cancelled",
    plannedMeals: 170,
    plannedBottles: 85,
    reliability: 30,
    actualMeals: null,
    actualBottles: null,
  },
];

export const demoRules: Omit<AirlineRule, "id">[] = [
  {
    airline: "AeroMexico",
    reuseThreshold: 70,
    combineThreshold: 40,
  },
  {
    airline: "United",
    reuseThreshold: 75,
    combineThreshold: 35,
  },
  {
    airline: "American Airlines",
    reuseThreshold: 65,
    combineThreshold: 45,
  },
];

export const demoEmployeeMetrics: EmployeeMetric[] = [
  {
    employeeName: "Maria Garcia",
    avgPrepTime: 12.5,
    errorRate: 2.1,
    complianceRate: 97.9,
    trolleysProcessed: 45,
  },
  {
    employeeName: "John Smith",
    avgPrepTime: 14.2,
    errorRate: 3.5,
    complianceRate: 96.5,
    trolleysProcessed: 38,
  },
  {
    employeeName: "Carlos Rodriguez",
    avgPrepTime: 11.8,
    errorRate: 1.8,
    complianceRate: 98.2,
    trolleysProcessed: 52,
  },
  {
    employeeName: "Lisa Chen",
    avgPrepTime: 13.1,
    errorRate: 2.7,
    complianceRate: 97.3,
    trolleysProcessed: 41,
  },
];

// Demo bottle analyses (omit id and timestamp, will be generated)
export const demoBottleAnalyses: Omit<BottleAnalysis, "id" | "timestamp">[] = [
  {
    flightId: null, // Will be set to first demo flight
    imageData: "data:image/png;base64,demo",
    bottleType: "Wine - Red",
    fillLevel: 85,
    recommendedAction: "reuse",
    aiAnalysis: "Bottle appears to be 85% full with wine. Recommended for reuse on next flight.",
  },
  {
    flightId: null, // Will be set to first demo flight
    imageData: "data:image/png;base64,demo",
    bottleType: "Champagne",
    fillLevel: 55,
    recommendedAction: "combine",
    aiAnalysis: "Bottle is 55% full. Recommended to combine with similar bottles to minimize waste.",
  },
  {
    flightId: null, // Will be set to second demo flight
    imageData: "data:image/png;base64,demo",
    bottleType: "Vodka",
    fillLevel: 25,
    recommendedAction: "discard",
    aiAnalysis: "Bottle is only 25% full. Below threshold for reuse or combination. Recommended to discard.",
  },
  {
    flightId: null, // Will be set to second demo flight
    imageData: "data:image/png;base64,demo",
    bottleType: "Whiskey",
    fillLevel: 78,
    recommendedAction: "reuse",
    aiAnalysis: "Bottle is 78% full. Excellent condition for reuse on next flight.",
  },
];

// Demo trolley verifications (omit id and timestamp, will be generated)
export const demoTrolleyVerifications: Omit<TrolleyVerification, "id" | "timestamp">[] = [
  {
    flightId: null, // Will be set to first demo flight
    imageData: "data:image/png;base64,demo",
    goldenLayoutName: "Standard Economy Layout",
    hasErrors: 0,
    errors: [],
    aiAnalysis: "All items correctly positioned. Trolley matches golden layout perfectly.",
  },
  {
    flightId: null, // Will be set to second demo flight
    imageData: "data:image/png;base64,demo",
    goldenLayoutName: "Business Class Layout",
    hasErrors: 1,
    errors: ["Missing 1 drink item in row 3", "Incorrect snack type detected in row 2"],
    aiAnalysis: "Trolley verification failed. Found 2 discrepancies compared to golden layout.",
  },
  {
    flightId: null, // Will be set to third demo flight
    imageData: "data:image/png;base64,demo",
    goldenLayoutName: "Premium Economy Layout",
    hasErrors: 0,
    errors: [],
    aiAnalysis: "Perfect match with golden layout. No errors detected.",
  },
];

// Fixed trend data for consistent demo mode
export const demoEfficiencyTrend: TrendData[] = [
  { date: "Oct 19", value: 94.2 },
  { date: "Oct 20", value: 95.8 },
  { date: "Oct 21", value: 96.3 },
  { date: "Oct 22", value: 97.1 },
  { date: "Oct 23", value: 96.9 },
  { date: "Oct 24", value: 97.5 },
  { date: "Oct 25", value: 98.2 },
];

export const demoFoodSavedTrend: TrendData[] = [
  { date: "Oct 19", value: 42 },
  { date: "Oct 20", value: 38 },
  { date: "Oct 21", value: 51 },
  { date: "Oct 22", value: 45 },
  { date: "Oct 23", value: 48 },
  { date: "Oct 24", value: 53 },
  { date: "Oct 25", value: 47 },
];
