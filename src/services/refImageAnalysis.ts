import axios from "axios";

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

  const prompt = `You are a professional hairstylist and AI image generation prompt engineer. Analyze this reference hairstyle image and create a detailed description that will be used to apply this exact hairstyle to a different person via AI image generation.

IMPORTANT: Do NOT describe the hair COLOR. The user will select the hair color separately. Focus ONLY on the hairstyle structure, cut, and styling.

Describe the hairstyle with PRECISE technical details:

1. **Length & Cut**: Exact length (e.g., chin-length, shoulder-length, mid-back), layering type (long layers, short choppy layers, one-length), and cut style name if identifiable

2. **Texture & Finish**: Hair texture (straight, wavy, curly, coily), finish (sleek/glossy, matte, natural, voluminous), and any visible styling (blown out, air-dried, heat-styled)

3. **Bangs/Fringe**: Type (curtain bangs, blunt bangs, side-swept, wispy, micro bangs) or no bangs, length relative to face

4. **Parting & Direction**: Part location (center, side, deep side, no part), hair flow direction, any asymmetry

5. **Volume & Shape**: Where volume is concentrated (roots, mid-lengths, ends), overall silhouette (round, triangular, elongated), any face-framing pieces

6. **Styling Details**: Visible techniques (curls, waves, flips, tucked behind ears, half-up), any accessories

OUTPUT FORMAT: Write a single, flowing description (3-4 sentences) in the style of an image generation prompt. Use vivid, specific adjectives. Do NOT use bullet points or lists. Do NOT mention hair color, the person's face, skin, or any non-hair features. Start directly with the hair description.

Example output style: "Shoulder-length layered hair with soft curtain bangs framing the face, styled in loose beach waves with natural volume at the roots. The layers start at chin-level and blend seamlessly to the ends, creating movement and texture. A subtle center part allows the hair to flow symmetrically, with the ends flipped slightly outward for a polished yet effortless finish."`;

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
