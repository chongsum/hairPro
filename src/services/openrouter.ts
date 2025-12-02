import axios from "axios";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const ANALYSIS_MODEL =
  process.env.EXPO_PUBLIC_AI_ANALYSIS_MODEL || "google/gemini-2.0-flash-001";
const IMAGE_MODEL =
  process.env.EXPO_PUBLIC_AI_IMAGE_MODEL || "google/gemini-3-pro-image-preview";

console.log("OpenRouter API Key set:", !!OPENROUTER_API_KEY);
console.log("Analysis Model:", ANALYSIS_MODEL);
console.log("Image Model:", IMAGE_MODEL);

const api = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://hairpro.app",
    "X-Title": "HairPro",
  },
});

export interface HairAnalysis {
  texture: string;
  density: string;
  condition: string;
  realism_score: number;
  observations: string;
  recommendations?: string[];
}

export const analyzeHair = async (
  base64Image: string
): Promise<HairAnalysis> => {
  try {
    const response = await api.post("/chat/completions", {
      model: ANALYSIS_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a professional hair stylist AI. Analyze this hair selfie and provide a detailed assessment.

Return ONLY valid JSON with these exact keys:
{
  "texture": "straight" | "wavy" | "curly" | "coily",
  "density": "thin" | "medium" | "thick",
  "condition": "dry" | "oily" | "healthy" | "damaged",
  "realism_score": 1-10 (how good is this photo for hairstyle visualization),
  "observations": "Brief summary of current hair state",
  "recommendations": ["array", "of", "styling", "tips"]
}

Output ONLY the JSON, no markdown or explanation.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI analysis response");
  } catch (error: any) {
    console.error(
      "Error analyzing hair:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

export interface StyleAssessment {
  is_realistic: boolean;
  realism_score: number;
  reasoning: string;
  required_treatments: string[];
  recommended_products: string[];
  estimated_time: string;
  alternatives?: string[];
}

export const assessStyleFeasibility = async (
  base64Image: string,
  targetStyle: string,
  gender: string,
  hairAnalysis: HairAnalysis
): Promise<StyleAssessment> => {
  try {
    const response = await api.post("/chat/completions", {
      model: ANALYSIS_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a professional hair stylist consultant. A ${gender} customer wants "${targetStyle}" hairstyle.

Current hair analysis:
- Texture: ${hairAnalysis.texture}
- Density: ${hairAnalysis.density}
- Condition: ${hairAnalysis.condition}

Assess if this style is achievable and provide a detailed plan.

Return ONLY valid JSON:
{
  "is_realistic": true/false,
  "realism_score": 1-10,
  "reasoning": "Explanation of why this style is/isn't achievable",
  "required_treatments": ["list of treatments needed"],
  "recommended_products": ["list of products"],
  "estimated_time": "Time to achieve this look (e.g., '3-6 months for growth')",
  "alternatives": ["alternative styles if not realistic"]
}

Output ONLY JSON.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse style assessment");
  } catch (error: any) {
    console.error(
      "Error assessing style:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

export const generateHairstyle = async (
  base64Image: string,
  styleDescription: string,
  gender: string,
  analysis: HairAnalysis
): Promise<string> => {
  try {
    console.log("=== STARTING IMAGE GENERATION ===");
    console.log("Using IMAGE_MODEL:", IMAGE_MODEL);

    const prompt = `Edit this photo to give the person a "${styleDescription}" hairstyle. 
    
CRITICAL: You MUST return the edited image. 
If you cannot return a direct image object, please output the image as a Base64 Data URI string in your text response (e.g. "data:image/jpeg;base64,...").
Keep the face exactly the same.`;

    console.log("Sending request to OpenRouter...");

    const response = await api.post("/chat/completions", {
      model: IMAGE_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      // Request image output
      response_format: { type: "text" },
    });

    console.log("=== RESPONSE RECEIVED ===");
    console.log(
      "Full response data:",
      JSON.stringify(response.data, null, 2).substring(0, 2000)
    );

    const choice = response.data.choices[0];
    const message = choice.message;

    console.log(
      "Message:",
      JSON.stringify(message, null, 2).substring(0, 1000)
    );

    // Method 1: Check for images array (OpenRouter format)
    if (
      message.images &&
      Array.isArray(message.images) &&
      message.images.length > 0
    ) {
      console.log("✓ Found images array");
      const img = message.images[0];
      console.log("Full image object structure:", JSON.stringify(img, null, 2));

      if (typeof img === "string") {
        if (img.startsWith("http")) return img;
        if (img.startsWith("data:")) return img;
        return `data:image/png;base64,${img}`;
      }
      if (typeof img === "object") {
        // OpenRouter format: { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
        if (img.image_url?.url) {
          console.log("✓ Found image_url.url in images array");
          return img.image_url.url;
        }
        if (img.url) return img.url;
        if (img.b64_json) return `data:image/png;base64,${img.b64_json}`;
        if (img.base64) return `data:image/png;base64,${img.base64}`;
        if (img.data) return `data:image/png;base64,${img.data}`;

        // Smart fallback: Look for ANY string value that looks like an image
        console.log("Looking for hidden image data in object...");
        for (const [key, value] of Object.entries(img)) {
          if (typeof value === "string") {
            if (value.startsWith("http")) return value;
            if (value.startsWith("data:image")) return value;
            // Likely base64 if long and no spaces
            if (value.length > 1000 && !value.includes(" ")) {
              return `data:image/png;base64,${value}`;
            }
          }
        }
      }
    }

    // Method 2: Check content array
    let content = message.content;

    if (Array.isArray(content)) {
      console.log("Content is array with", content.length, "items");
      console.log(
        "Content array:",
        JSON.stringify(content, null, 2).substring(0, 2000)
      );

      for (const item of content) {
        console.log(
          "Checking item type:",
          item.type,
          "keys:",
          Object.keys(item || {})
        );

        if (item.type === "image_url" && item.image_url?.url) {
          console.log("✓ Found image_url in content array");
          return item.image_url.url;
        }
        if (item.type === "image") {
          console.log("✓ Found image type in content");
          if (item.source?.data) {
            return `data:image/${item.source.media_type || "png"};base64,${
              item.source.data
            }`;
          }
          if (item.data) {
            return `data:image/png;base64,${item.data}`;
          }
        }
        // Gemini/Google AI specific format - inlineData
        if (item.inlineData) {
          console.log(
            "✓ Found inlineData with mimeType:",
            item.inlineData.mimeType
          );
          return `data:${item.inlineData.mimeType || "image/png"};base64,${
            item.inlineData.data
          }`;
        }
        // Alternative: inline_data (snake_case variant)
        if (item.inline_data) {
          console.log(
            "✓ Found inline_data with mimeType:",
            item.inline_data.mimeType
          );
          return `data:${
            item.inline_data.mimeType ||
            item.inline_data.mime_type ||
            "image/png"
          };base64,${item.inline_data.data}`;
        }
      }
      const textItem = content.find(
        (item: any) => item.type === "text" || item.text
      );
      if (textItem) content = textItem.text || textItem;
    }

    // Method 3: String content
    if (typeof content === "string") {
      console.log(
        "Content is string, length:",
        content.length,
        "checking for embedded image..."
      );
      console.log("First 200 chars:", content.substring(0, 200));

      // Check for data URL first (most explicit)
      const dataUrlMatch = content.match(
        /data:image\/[^;]+;base64,[A-Za-z0-9+/=\s]+/
      );
      if (dataUrlMatch) {
        console.log("✓ Found data URL in string");
        // Clean up any whitespace in the base64
        return dataUrlMatch[0].replace(/\s/g, "");
      }

      // Check for HTTPS URL to an image
      const urlMatch = content.match(
        /https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i
      );
      if (urlMatch) {
        console.log("✓ Found image URL:", urlMatch[0]);
        return urlMatch[0];
      }

      // Long base64 string might be the image itself (no data: prefix)
      // Be more lenient - allow newlines/spaces in base64
      const cleanContent = content.replace(/[\s\n\r]/g, "").trim();
      if (
        cleanContent.length > 1000 &&
        /^[A-Za-z0-9+/=]+$/.test(cleanContent)
      ) {
        console.log(
          "✓ Content appears to be raw base64, length:",
          cleanContent.length
        );
        return `data:image/png;base64,${cleanContent}`;
      }

      // Try to extract base64 from a longer string
      const base64Match = content.match(/([A-Za-z0-9+/]{100,}[=]{0,2})/);
      if (base64Match && base64Match[1].length > 1000) {
        console.log(
          "✓ Found embedded base64 in string, length:",
          base64Match[1].length
        );
        return `data:image/png;base64,${base64Match[1]}`;
      }

      // General URL check
      const generalUrlMatch = content.match(/https?:\/\/[^\s"'<>]+/i);
      if (generalUrlMatch) {
        console.log("✓ Found URL:", generalUrlMatch[0]);
        return generalUrlMatch[0];
      }

      console.log("No image found in string content, returning text");
      return content;
    }

    return "The model did not return an image. Please try again.";
  } catch (error: any) {
    console.error("=== IMAGE GENERATION ERROR ===");
    console.error("Error:", error?.response?.data || error.message);
    throw error;
  }
};
