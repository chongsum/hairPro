import axios from "axios";
import { REF_IMAGE_ANALYSIS_PROMPT } from "./prompts";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const VISION_MODEL =
  process.env.EXPO_PUBLIC_AI_VISION_MODEL || "anthropic/claude-sonnet-4";

const openRouterApi = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://hairpro.app",
    "X-Title": "HairPro",
  },
});

/**
 * Analyze reference image to describe hairstyle
 */
export const analyzeRefImageHairstyle = async (
  imageBase64OrUrl: string
): Promise<string> => {
  console.log("=== ANALYZING REF IMAGE HAIRSTYLE ===");
  console.log("Vision model:", VISION_MODEL);
  console.log(
    "Image input type:",
    imageBase64OrUrl.startsWith("http") ? "URL" : "base64"
  );

  // Prompt from centralized prompts.ts
  const prompt = REF_IMAGE_ANALYSIS_PROMPT;

  const imageContent =
    imageBase64OrUrl.startsWith("data:") || imageBase64OrUrl.startsWith("http")
      ? imageBase64OrUrl
      : `data:image/jpeg;base64,${imageBase64OrUrl}`;

  try {
    const response = await openRouterApi.post("/chat/completions", {
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageContent },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const content = response.data.choices[0]?.message?.content;
    console.log("=== REF IMAGE ANALYSIS RESPONSE ===");
    console.log("Response content:", content?.substring(0, 500));

    if (!content) {
      console.error("No content in response");
      throw new Error("No response from vision model");
    }

    return content;
  } catch (error: any) {
    console.error("=== REF IMAGE ANALYSIS ERROR ===");
    console.error("Error message:", error?.message);
    console.error("Error response:", error?.response?.data);
    throw error;
  }
};
