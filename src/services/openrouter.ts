import axios from "axios";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

// Model for vision/image analysis tasks
const VISION_MODEL =
  process.env.EXPO_PUBLIC_AI_VISION_MODEL || "anthropic/claude-sonnet-4";

// Model for text-only tasks (feasibility assessment)
const TEXT_MODEL =
  process.env.EXPO_PUBLIC_AI_TEXT_MODEL || "anthropic/claude-sonnet-4";

console.log("OpenRouter API Key set:", !!OPENROUTER_API_KEY);
console.log("OpenRouter Vision Model:", VISION_MODEL);
console.log("OpenRouter Text Model:", TEXT_MODEL);

const api = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://hairpro.app",
    "X-Title": "HairPro",
  },
});

// Simplified Hair Analysis Result Interface (Only essential fields for generation)
export interface HairAnalysis {
  // Essential for image generation
  hairTexture: {
    value: string; // "straight", "wavy", "curly", "coily"
  };
  hairDensity: {
    value: string; // "thin", "medium", "thick"
  };
  faceShape: {
    value: string; // "oval", "round", "square", "heart", "oblong", "diamond"
  };
  // Additional useful info (kept for display/feasibility)
  hairLength: {
    value: string; // "very short", "short", "medium", "long", "very long"
  };
  hairColor: {
    value: string; // natural color description
  };
  hairCondition: {
    value: string; // "excellent", "good", "fair", "needs care"
    score: number; // 1-4
  };
  overallScore: number; // 1-100
  stylingPotential: string; // "high", "medium", "low"
}

// Feasibility Assessment Result Interface
export interface FeasibilityAssessment {
  feasible: boolean;
  overallScore: number; // 1-100
  lengthCompatibility: {
    score: number; // 1-100
    assessment: string;
    timeToGrow?: string; // if current hair is too short
  };
  textureCompatibility: {
    score: number; // 1-100
    assessment: string;
    stylingRequired?: string;
  };
  densityCompatibility: {
    score: number; // 1-100
    assessment: string;
  };
  maintenanceLevel: {
    value: string; // "low", "medium", "high"
    description: string;
  };
  estimatedSalonTime: string;
  concerns: string[];
  suggestions: string[];
  professionalNotes: string;
}

/**
 * Send a chat completion request to OpenRouter
 */
export const chatCompletion = async (
  messages: Array<{ role: string; content: string | any[] }>,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> => {
  try {
    const model = options?.model || TEXT_MODEL;

    console.log("=== STARTING OPENROUTER CHAT COMPLETION ===");
    console.log("Using model:", model);

    const response = await api.post("/chat/completions", {
      model: model,
      messages: messages,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature ?? 0.3,
    });

    console.log("=== OPENROUTER RESPONSE RECEIVED ===");

    const content = response.data.choices[0]?.message?.content;

    if (content) {
      return content;
    }

    throw new Error("No response content from OpenRouter");
  } catch (error: any) {
    console.error("=== OPENROUTER CHAT COMPLETION ERROR ===");
    console.error("Error:", error?.response?.data || error.message);
    throw error;
  }
};

/**
 * OPTIMIZED: Fast hair analysis using single image
 * Only analyzes essential fields: texture, density, face shape
 */
export const analyzeHair = async (
  imageBase64: string,
  _unusedImage: string, // Kept for backward compatibility, ignored
  gender: string
): Promise<HairAnalysis> => {
  try {
    console.log("=== STARTING FAST HAIR ANALYSIS ===");
    console.log("Using vision model:", VISION_MODEL);

    // Simplified prompt for faster response
    const analysisPrompt = `Analyze this ${gender} client's hair for a salon consultation.

Return ONLY this JSON (no other text):
{
  "hairTexture": {"value": "<straight|wavy|curly|coily>"},
  "hairDensity": {"value": "<thin|medium|thick>"},
  "faceShape": {"value": "<oval|round|square|heart|oblong|diamond>"},
  "hairLength": {"value": "<very short|short|medium|long|very long>"},
  "hairColor": {"value": "<brief color description>"},
  "hairCondition": {"value": "<excellent|good|fair|needs care>", "score": <1-4>},
  "overallScore": <50-100>,
  "stylingPotential": "<high|medium|low>"
}`;

    const response = await api.post("/chat/completions", {
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: analysisPrompt,
            },
          ],
        },
      ],
      max_tokens: 512, // Reduced from 2048 - we need less output
      temperature: 0.1, // Lower for more consistent results
    });

    console.log("=== HAIR ANALYSIS RESPONSE RECEIVED ===");

    const content = response.data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from hair analysis");
    }

    // Parse JSON response
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      // Also try to find JSON object directly
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      return JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse hair analysis JSON:", parseError);
      return getDefaultHairAnalysis();
    }
  } catch (error: any) {
    console.error("=== HAIR ANALYSIS ERROR ===");
    console.error("Error:", error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Feasibility assessment using text-only model
 * Compares current hair analysis with target style
 */
export const assessFeasibility = async (
  hairAnalysis: HairAnalysis,
  targetStyle: string,
  targetLength: string,
  targetColor: string,
  gender: string
): Promise<FeasibilityAssessment> => {
  try {
    console.log("=== STARTING FEASIBILITY ASSESSMENT ===");
    console.log("Using text model:", TEXT_MODEL);

    // Simplified assessment prompt
    const assessmentPrompt = `You are a professional hair stylist. Assess if this hairstyle is achievable.

## Client's Current Hair:
- Texture: ${hairAnalysis.hairTexture.value}
- Density: ${hairAnalysis.hairDensity.value}
- Length: ${hairAnalysis.hairLength.value}
- Color: ${hairAnalysis.hairColor.value}
- Face Shape: ${hairAnalysis.faceShape.value}
- Condition: ${hairAnalysis.hairCondition.value}

## Target Style:
- Style: ${targetStyle}
- Length: ${targetLength}
- Color: ${targetColor}
- Gender: ${gender}

Return ONLY this JSON:
{
  "feasible": <true|false>,
  "overallScore": <1-100>,
  "lengthCompatibility": {
    "score": <1-100>,
    "assessment": "<brief assessment>",
    "timeToGrow": "<if needed>"
  },
  "textureCompatibility": {
    "score": <1-100>,
    "assessment": "<brief assessment>",
    "stylingRequired": "<tools/products if needed>"
  },
  "densityCompatibility": {
    "score": <1-100>,
    "assessment": "<brief assessment>"
  },
  "maintenanceLevel": {
    "value": "<low|medium|high>",
    "description": "<brief description>"
  },
  "estimatedSalonTime": "<time estimate>",
  "concerns": ["<concern if any>"],
  "suggestions": ["<suggestion>"],
  "professionalNotes": "<brief note for stylist>"
}`;

    const response = await chatCompletion(
      [{ role: "user", content: assessmentPrompt }],
      {
        model: TEXT_MODEL,
        maxTokens: 2048,
        temperature: 0.2,
      }
    );

    // Parse JSON response
    try {
      let jsonStr = response;
      console.log("Raw feasibility response:", response.substring(0, 500));
      
      // Remove markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      // Extract JSON object
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      const parsed = JSON.parse(jsonStr.trim());
      console.log("Parsed feasibility successfully");
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse feasibility JSON:", parseError);
      console.error("Response was:", response);
      return getDefaultFeasibilityAssessment();
    }
  } catch (error: any) {
    console.error("=== FEASIBILITY ASSESSMENT ERROR ===");
    console.error("Error:", error?.response?.data || error.message);
    throw error;
  }
};

// Helper function for default hair analysis
function getDefaultHairAnalysis(): HairAnalysis {
  return {
    hairTexture: { value: "wavy" },
    hairDensity: { value: "medium" },
    faceShape: { value: "oval" },
    hairLength: { value: "medium" },
    hairColor: { value: "brown" },
    hairCondition: { value: "good", score: 3 },
    overallScore: 70,
    stylingPotential: "medium",
  };
}

// Helper function for default feasibility assessment
function getDefaultFeasibilityAssessment(): FeasibilityAssessment {
  return {
    feasible: true,
    overallScore: 70,
    lengthCompatibility: {
      score: 70,
      assessment: "Assessment could not be completed fully",
    },
    textureCompatibility: {
      score: 70,
      assessment: "Assessment could not be completed fully",
    },
    densityCompatibility: {
      score: 70,
      assessment: "Assessment could not be completed fully",
    },
    maintenanceLevel: {
      value: "medium",
      description: "Regular maintenance recommended",
    },
    estimatedSalonTime: "1-2 hours",
    concerns: ["Please provide clearer photo for better assessment"],
    suggestions: ["Consult with your stylist for personalized advice"],
    professionalNotes: "Manual assessment recommended",
  };
}
