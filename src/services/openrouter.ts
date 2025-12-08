import axios from "axios";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

// Model for vision/image analysis tasks
const VISION_MODEL =
  process.env.EXPO_PUBLIC_AI_VISION_MODEL || "anthropic/claude-sonnet-4";

console.log("OpenRouter API Key set:", !!OPENROUTER_API_KEY);
console.log("OpenRouter Vision Model:", VISION_MODEL);

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
  // Additional useful info (kept for display)
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
      max_tokens: 1024,
      temperature: 0.1,
    });

    console.log("=== HAIR ANALYSIS RESPONSE RECEIVED ===");

    const content = response.data.choices[0]?.message?.content;
    console.log("Raw hair analysis response:", content?.substring(0, 500));

    if (!content) {
      throw new Error("No response content from hair analysis");
    }

    // Parse JSON response
    try {
      let jsonStr = content;

      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Extract JSON object
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      const parsed = JSON.parse(jsonStr.trim());
      console.log("Parsed hair analysis successfully");
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse hair analysis JSON:", parseError);
      console.error("Response content was:", content);
      return getDefaultHairAnalysis();
    }
  } catch (error: any) {
    console.error("=== HAIR ANALYSIS ERROR ===");
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
