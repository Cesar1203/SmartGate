import type { WeatherData } from "@shared/schema";

// Mock weather service for MVP
// In production, this would integrate with OpenWeatherMap or similar API
export async function getWeatherData(destination: string, dateTime: Date): Promise<WeatherData> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock weather data with some variability
  const randomFactor = Math.random();
  const conditions = ["Clear", "Partly Cloudy", "Cloudy", "Rain", "Thunderstorm", "Fog"];
  const conditionIndex = Math.floor(randomFactor * conditions.length);

  return {
    temperature: 15 + Math.floor(randomFactor * 20),
    windSpeed: Math.floor(randomFactor * 50),
    precipitation: Math.floor(randomFactor * 100),
    visibility: 5 + Math.floor(randomFactor * 5),
    conditions: conditions[conditionIndex],
  };
}

export function calculateFlightReliability(weather: WeatherData): number {
  let reliability = 100;

  // Reduce reliability based on adverse conditions
  if (weather.conditions === "Thunderstorm") {
    reliability -= 40;
  } else if (weather.conditions === "Fog") {
    reliability -= 30;
  } else if (weather.conditions === "Rain") {
    reliability -= 20;
  } else if (weather.conditions === "Cloudy") {
    reliability -= 10;
  }

  // Wind speed impact
  if (weather.windSpeed > 40) {
    reliability -= 25;
  } else if (weather.windSpeed > 30) {
    reliability -= 15;
  } else if (weather.windSpeed > 20) {
    reliability -= 10;
  }

  // Precipitation impact
  if (weather.precipitation > 70) {
    reliability -= 20;
  } else if (weather.precipitation > 40) {
    reliability -= 10;
  }

  // Visibility impact
  if (weather.visibility < 3) {
    reliability -= 25;
  } else if (weather.visibility < 5) {
    reliability -= 15;
  }

  return Math.max(0, Math.min(100, reliability));
}

export function getReliabilityRecommendation(reliability: number): string {
  if (reliability >= 80) {
    return "Excellent flight conditions. Proceed with full meal preparation as planned.";
  } else if (reliability >= 70) {
    return "Good flight conditions with minor concerns. Maintain standard operations.";
  } else if (reliability >= 50) {
    return "Moderate concerns due to weather. Consider reducing fresh food load by 20%.";
  } else {
    return "Low reliability due to adverse weather. Recommend reducing fresh food load by 30-40% to minimize waste.";
  }
}
