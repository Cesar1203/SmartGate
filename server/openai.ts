import OpenAI from "openai";

// Reference from javascript_openai blueprint
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BottleAnalysisResult {
  bottleType: string;
  fillLevel: number;
  recommendedAction: "reuse" | "combine" | "discard";
  analysis: string;
}

export interface TrolleyVerificationResult {
  hasErrors: boolean;
  errors: string[];
  analysis: string;
}

export async function analyzeBottleImage(
  base64Image: string,
  reuseThreshold: number,
  combineThreshold: number
): Promise<BottleAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing alcohol bottle images for airline catering operations. 
Analyze the bottle image and determine:
1. The type of bottle (wine, whisky, vodka, etc.)
2. The approximate fill level as a percentage (0-100)
3. Based on the fill level and these thresholds:
   - Above ${reuseThreshold}%: recommend "reuse"
   - Between ${combineThreshold}% and ${reuseThreshold}%: recommend "combine"
   - Below ${combineThreshold}%: recommend "discard"

Respond with JSON in this exact format:
{
  "bottleType": "wine/whisky/vodka/etc",
  "fillLevel": 75,
  "recommendedAction": "reuse/combine/discard",
  "analysis": "Brief explanation of the recommendation"
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this bottle image and provide the bottle type, fill level, and recommended action.",
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      bottleType: result.bottleType || "Unknown",
      fillLevel: Math.max(0, Math.min(100, result.fillLevel || 0)),
      recommendedAction: result.recommendedAction || "discard",
      analysis: result.analysis || "Analysis completed",
    };
  } catch (error) {
    console.error("Bottle analysis error:", error);
    throw new Error("Failed to analyze bottle image");
  }
}

export async function verifyTrolleyImage(base64Image: string): Promise<TrolleyVerificationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert at verifying airline catering trolley configurations.
Analyze the trolley image and check for:
1. Missing items or incorrect placements
2. Proper organization and layout
3. Any visible discrepancies

Respond with JSON in this exact format:
{
  "hasErrors": true/false,
  "errors": ["error description 1", "error description 2"],
  "analysis": "Overall assessment of the trolley configuration"
}

If everything looks correct, set hasErrors to false and errors to an empty array.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please verify this trolley configuration against standard airline catering layouts.",
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      hasErrors: result.hasErrors || false,
      errors: result.errors || [],
      analysis: result.analysis || "Verification completed",
    };
  } catch (error) {
    console.error("Trolley verification error:", error);
    throw new Error("Failed to verify trolley image");
  }
}
