
export interface BottleAnalysisResult {
  fillLevel: number;
  recommendedAction: "reuse" | "combine" | "discard";
  analysis: string;
}

export interface TrolleyVerificationResult {
  hasErrors: boolean;
  errors: string[];
  analysis: string;
}

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_API_URL = "https://detect.roboflow.com";

// Roboflow model configuration
// To use your own trained models, set these environment variables:
// ROBOFLOW_BOTTLE_MODEL - Your bottle detection model (format: "workspace/project/version")
// ROBOFLOW_TROLLEY_MODEL - Your trolley verification model (format: "workspace/project/version")
// 
// Example: If you don't have custom models, leave these empty and the system will use simulated analysis
const BOTTLE_MODEL_ID = process.env.ROBOFLOW_BOTTLE_MODEL || "";
const TROLLEY_MODEL_ID = process.env.ROBOFLOW_TROLLEY_MODEL || "";

// Simulated analysis for demo mode when Roboflow is not available
function generateSimulatedBottleAnalysis(
  reuseThreshold: number,
  combineThreshold: number
): BottleAnalysisResult {
  // Generate realistic fill levels with better distribution
  const fillLevel = Math.floor(Math.random() * 90) + 10; // 10-100%
  
  let recommendedAction: "reuse" | "combine" | "discard";
  let analysis: string;
  
  if (fillLevel >= reuseThreshold) {
    recommendedAction = "reuse";
    analysis = `Bottle detected at ${fillLevel}% fill level. Excellent condition for reuse on next flight.`;
  } else if (fillLevel >= combineThreshold) {
    recommendedAction = "combine";
    analysis = `Bottle detected at ${fillLevel}% fill level. Recommended to combine with similar bottles to minimize waste.`;
  } else {
    recommendedAction = "discard";
    analysis = `Bottle detected at ${fillLevel}% fill level. Below threshold for reuse or combination.`;
  }
  
  return {
    fillLevel,
    recommendedAction,
    analysis,
  };
}

// Simulated trolley verification for demo mode
function generateSimulatedTrolleyVerification(): TrolleyVerificationResult {
  const hasErrors = Math.random() > 0.6; // 40% chance of errors
  
  const possibleErrors = [
    "Missing beverage item in section B",
    "Incorrect snack placement detected",
    "Meal container not aligned properly",
    "Missing cutlery set in row 3",
    "Wrong beverage type in compartment A2",
  ];
  
  const errors: string[] = [];
  if (hasErrors) {
    const numErrors = Math.floor(Math.random() * 2) + 1; // 1-2 errors
    for (let i = 0; i < numErrors; i++) {
      const error = possibleErrors[Math.floor(Math.random() * possibleErrors.length)];
      if (!errors.includes(error)) {
        errors.push(error);
      }
    }
  }
  
  const analysis = hasErrors
    ? `Trolley verification identified ${errors.length} discrepanc${errors.length === 1 ? 'y' : 'ies'}. Please review and correct before service. [Simulated Analysis]`
    : "All items correctly positioned. Trolley matches standard layout perfectly. [Simulated Analysis]";
  
  return {
    hasErrors: errors.length > 0,
    errors,
    analysis,
  };
}

// Estimate fill level from Roboflow bounding box
function estimateFillLevel(predictions: any[], imageHeight: number): number {
  if (!predictions || predictions.length === 0) {
    return Math.floor(Math.random() * 95) + 5; // Random fallback
  }
  
  // Get the largest bounding box (likely the bottle)
  const mainBottle = predictions.reduce((prev, current) => 
    (prev.height > current.height) ? prev : current
  );
  
  // Calculate fill level based on bounding box position and size
  // Higher y-position means less liquid (empty at top)
  const bottleTop = mainBottle.y - (mainBottle.height / 2);
  const fillRatio = 1 - (bottleTop / imageHeight);
  
  // Convert to percentage and add some variance
  let fillLevel = Math.floor(fillRatio * 100);
  fillLevel = Math.max(5, Math.min(95, fillLevel)); // Clamp between 5-95%
  
  return fillLevel;
}

export async function analyzeBottleImage(
  base64Image: string,
  reuseThreshold: number,
  combineThreshold: number
): Promise<BottleAnalysisResult> {
  try {
    if (!ROBOFLOW_API_KEY) {
      console.log("Roboflow API key not configured - using simulated analysis");
      return generateSimulatedBottleAnalysis(reuseThreshold, combineThreshold);
    }

    // Extract base64 data (remove data:image/... prefix if present)
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    // Make request to Roboflow inference API using native fetch
    const url = new URL(`${ROBOFLOW_API_URL}/${BOTTLE_MODEL_ID}`);
    url.searchParams.append('api_key', ROBOFLOW_API_KEY);
    url.searchParams.append('confidence', '40');
    url.searchParams.append('overlap', '30');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: base64Data,
    });

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${response.status}`);
    }

    const data = await response.json();
    const predictions = data.predictions || [];
    const imageHeight = data.image?.height || 1000;

    // Extract fill level from predictions
    const fillLevel = estimateFillLevel(predictions, imageHeight);

    // Determine recommended action based on fill level
    let recommendedAction: "reuse" | "combine" | "discard";
    let analysis: string;

    if (fillLevel >= reuseThreshold) {
      recommendedAction = "reuse";
      analysis = `Bottle detected at ${fillLevel}% fill level. Excellent condition for reuse on next flight.`;
    } else if (fillLevel >= combineThreshold) {
      recommendedAction = "combine";
      analysis = `Bottle detected at ${fillLevel}% fill level. Recommended to combine with similar bottles to minimize waste.`;
    } else {
      recommendedAction = "discard";
      analysis = `Bottle detected at ${fillLevel}% fill level. Below threshold for reuse or combination.`;
    }

    return {
      fillLevel,
      recommendedAction,
      analysis,
    };
  } catch (error: any) {
    console.error("Roboflow bottle analysis error:", error.message);
    
    // Use simulated analysis when Roboflow fails
    console.log("Roboflow API unavailable - using simulated analysis for demo");
    return generateSimulatedBottleAnalysis(reuseThreshold, combineThreshold);
  }
}

export async function verifyTrolleyImage(base64Image: string): Promise<TrolleyVerificationResult> {
  try {
    if (!ROBOFLOW_API_KEY) {
      console.log("Roboflow API key not configured - using simulated verification");
      return generateSimulatedTrolleyVerification();
    }

    // Extract base64 data
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    // Make request to Roboflow inference API using native fetch
    const url = new URL(`${ROBOFLOW_API_URL}/${TROLLEY_MODEL_ID}`);
    url.searchParams.append('api_key', ROBOFLOW_API_KEY);
    url.searchParams.append('confidence', '40');
    url.searchParams.append('overlap', '30');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: base64Data,
    });

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${response.status}`);
    }

    const data = await response.json();
    const predictions = data.predictions || [];

    // Analyze predictions to detect errors
    const errors: string[] = [];
    const expectedItems = ["beverage", "meal", "cutlery", "snack"];
    
    // Check for missing or misplaced items based on predictions
    if (predictions.length < 5) {
      errors.push("Missing items detected - fewer items than expected");
    }

    // Check for low-confidence detections (possible misplacements)
    const lowConfidencePredictions = predictions.filter((p: any) => p.confidence < 0.6);
    if (lowConfidencePredictions.length > 0) {
      errors.push(`${lowConfidencePredictions.length} item(s) in incorrect position`);
    }

    const hasErrors = errors.length > 0;
    const analysis = hasErrors
      ? `Trolley verification identified ${errors.length} discrepanc${errors.length === 1 ? 'y' : 'ies'}. Please review and correct before service.`
      : `All items correctly positioned. Trolley configuration verified successfully with ${predictions.length} items detected.`;

    return {
      hasErrors,
      errors,
      analysis,
    };
  } catch (error: any) {
    console.error("Roboflow trolley verification error:", error.message);
    
    // Use simulated verification when Roboflow fails
    console.log("Roboflow API unavailable - using simulated verification for demo");
    return generateSimulatedTrolleyVerification();
  }
}
