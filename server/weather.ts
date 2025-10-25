import type { WeatherData } from "@shared/schema";

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

// Extract airport code from destination string (e.g., "New York (JFK)" -> "JFK")
function extractAirportCode(destination: string): string {
  const match = destination.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : destination;
}

// Airport coordinates for major airports worldwide
const airportCoordinates: Record<string, { lat: number; lon: number }> = {
  // USA
  JFK: { lat: 40.6413, lon: -73.7781 },
  LAX: { lat: 33.9416, lon: -118.4085 },
  ORD: { lat: 41.9742, lon: -87.9073 },
  ATL: { lat: 33.6407, lon: -84.4277 },
  DFW: { lat: 32.8998, lon: -97.0403 },
  MIA: { lat: 25.7959, lon: -80.2870 },
  SFO: { lat: 37.6213, lon: -122.3790 },
  SEA: { lat: 47.4502, lon: -122.3088 },
  LAS: { lat: 36.0840, lon: -115.1537 },
  
  // Europe
  LHR: { lat: 51.4700, lon: -0.4543 },
  CDG: { lat: 49.0097, lon: 2.5479 },
  AMS: { lat: 52.3105, lon: 4.7683 },
  FRA: { lat: 50.0379, lon: 8.5622 },
  MAD: { lat: 40.4719, lon: -3.5626 },
  BCN: { lat: 41.2974, lon: 2.0833 },
  
  // Mexico
  MEX: { lat: 19.4363, lon: -99.0721 },
  CUN: { lat: 21.0365, lon: -86.8771 },
  GDL: { lat: 20.5218, lon: -103.3119 },
  MTY: { lat: 25.7785, lon: -100.1069 },
  
  // South America
  GRU: { lat: -23.4356, lon: -46.4731 },
  EZE: { lat: -34.8222, lon: -58.5358 },
  
  // Asia
  NRT: { lat: 35.7720, lon: 140.3929 },
  HKG: { lat: 22.3080, lon: 113.9185 },
  SIN: { lat: 1.3644, lon: 103.9915 },
  DXB: { lat: 25.2532, lon: 55.3657 },
};

export async function getWeatherData(destination: string, dateTime: Date): Promise<WeatherData> {
  const airportCode = extractAirportCode(destination);
  const coords = airportCoordinates[airportCode];

  // If no API key or unknown airport, use mock data
  if (!OPENWEATHERMAP_API_KEY || !coords) {
    return getMockWeatherData();
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
    );

    if (!response.ok) {
      console.warn("Weather API request failed, using mock data");
      return getMockWeatherData();
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
      precipitation: data.rain?.["1h"] ? Math.round(data.rain["1h"] * 100) : 0,
      visibility: Math.round(data.visibility / 1000), // meters to km
      conditions: data.weather[0]?.main || "Clear",
    };
  } catch (error) {
    console.warn("Weather API error, using mock data:", error);
    return getMockWeatherData();
  }
}

function getMockWeatherData(): WeatherData {
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
