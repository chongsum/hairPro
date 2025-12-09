/**
 * ============================================================
 * FAL AI SERVICE - IMAGE GENERATION
 * ============================================================
 *
 * Generates new hairstyle on user's photo using text description.
 * Supports multiple image-to-image models configured in models.ts
 *
 * See src/services/prompts.ts for all prompt templates.
 * ============================================================
 */

import { fal } from "@fal-ai/client";
import {
  wrapForKlingModel,
  wrapForNanoBananaModel,
  wrapForFluxModel,
} from "./prompts";
import { ImageModel } from "../constants/models";

// ============================================================
// CONFIGURATION
// ============================================================

const FAL_API_KEY = process.env.EXPO_PUBLIC_FAL_API_KEY;

fal.config({
  credentials: FAL_API_KEY,
});

console.log("Fal AI API Key set:", !!FAL_API_KEY);

// ============================================================
// TYPES
// ============================================================

interface FalImageResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
}

// ============================================================
// HAIRSTYLE GENERATION (for user photos)
// ============================================================
/**
 * Generate a new hairstyle on user's photo using text description
 *
 * @param base64Image - User's photo (base64 or data URL)
 * @param prompt - Pre-built prompt with hairstyle description
 * @param gender - User's gender
 * @param model - The image model to use for generation
 */
export const generateHairstyle = async (
  base64Image: string,
  prompt: string,
  gender: string,
  model: ImageModel
): Promise<string> => {
  try {
    console.log("=== FAL AI: HAIRSTYLE GENERATION ===");
    console.log("Model:", model.name, `(${model.endpoint})`);

    // Validate input
    if (!base64Image || base64Image.length < 100) {
      throw new Error("Invalid or missing base64 image data");
    }

    // Prepare user image
    const userImageUrl = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    // Wrap prompt based on model type
    let finalPrompt = prompt;
    switch (model.type) {
      case "kling":
        finalPrompt = wrapForKlingModel(prompt);
        break;
      case "nano-banana":
        finalPrompt = wrapForNanoBananaModel(prompt);
        break;
      case "flux":
        finalPrompt = wrapForFluxModel(prompt);
        break;
      default:
        // Keep original prompt for unknown types
        break;
    }

    console.log("Final prompt:", finalPrompt.substring(0, 200) + "...");

    // Build input based on model input format
    let input: Record<string, any>;
    if (model.inputFormat === "single") {
      input = {
        image_url: userImageUrl,
        prompt: finalPrompt,
        output_format: "jpeg",
      };
      console.log("Input: Single image format (image_url)");
    } else {
      // Array format for kling, nano-banana and other models
      input = {
        image_urls: [userImageUrl],
        prompt: finalPrompt,
        num_images: 1,
        output_format: "jpeg",
      };
      console.log("Input: Array format (image_urls)");
    }

    // Call Fal AI with timeout
    let hasLoggedProgress = false;
    let lastStatus = "";
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Generation timed out after 3 minutes")), 180000);
    });
    
    const generatePromise = fal.subscribe(model.endpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status !== lastStatus) {
          console.log("Queue status:", update.status);
          lastStatus = update.status;
        }
        if (update.status === "IN_PROGRESS" && !hasLoggedProgress) {
          console.log("Generation in progress...");
          hasLoggedProgress = true;
        }
      },
    }) as Promise<{ data: FalImageResult }>;
    
    const result = await Promise.race([generatePromise, timeoutPromise]);

    console.log("=== FAL AI: RESPONSE RECEIVED ===");

    if (result.data?.images && result.data.images.length > 0) {
      const imageUrl = result.data.images[0].url;
      console.log("✓ Generated image URL:", imageUrl);
      return imageUrl;
    }

    throw new Error("No image was generated. Please try again.");
  } catch (error: any) {
    console.error("=== FAL AI: ERROR ===");
    console.error("Error:", error?.message || error);
    if (error?.body) {
      console.error("Error body:", JSON.stringify(error.body, null, 2));
    }
    throw new Error(
      error?.message || "Failed to generate hairstyle with Fal AI"
    );
  }
};
