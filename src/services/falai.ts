import { fal } from "@fal-ai/client";

const FAL_API_KEY = process.env.EXPO_PUBLIC_FAL_API_KEY;

// Configure Fal AI client
fal.config({
  credentials: FAL_API_KEY,
});

console.log("Fal AI API Key set:", !!FAL_API_KEY);

// Model options for different use cases
const IMAGE_MODELS = {
  // Fast image generation
  FLUX_SCHNELL: "fal-ai/flux/schnell",
  // High quality image generation
  FLUX_DEV: "fal-ai/flux/dev",
  // Image to image transformation
  FLUX_DEV_IMG2IMG: "fal-ai/flux/dev/image-to-image",
  // Professional quality
  FLUX_PRO: "fal-ai/flux-pro/v1.1",
  // Ultra high quality
  FLUX_PRO_ULTRA: "fal-ai/flux-pro/v1.1-ultra",
  // Realism focused
  FLUX_REALISM: "fal-ai/flux-realism",
  // Google Nano Banana Pro (Gemini 3 Pro Image) - Best for character consistency
  NANO_BANANA_PRO: "fal-ai/nano-banana-pro/edit",
  GEMINI_3_PRO: "fal-ai/gemini-3-pro-image-preview/edit",
};

// Models that use image_urls (array) instead of image_url
const GOOGLE_MODELS = [
  "fal-ai/nano-banana-pro/edit",
  "fal-ai/gemini-3-pro-image-preview/edit",
  "fal-ai/nano-banana-pro",
  "fal-ai/gemini-3-pro-image-preview",
];

// Default model for hairstyle generation
const DEFAULT_HAIRSTYLE_MODEL =
  process.env.EXPO_PUBLIC_FAL_IMAGE_MODEL || IMAGE_MODELS.FLUX_DEV_IMG2IMG;

console.log("Fal AI Image Model:", DEFAULT_HAIRSTYLE_MODEL);

interface FalImageResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings?: {
    inference: number;
  };
  seed?: number;
  has_nsfw_concepts?: boolean[];
  prompt?: string;
}

/**
 * Generate a new hairstyle using Fal AI's image-to-image model
 */
export const generateHairstyle = async (
  base64Image: string,
  styleDescription: string,
  gender: string
): Promise<string> => {
  try {
    console.log("=== STARTING FAL AI IMAGE GENERATION ===");
    console.log("Using model:", DEFAULT_HAIRSTYLE_MODEL);

    // Check if using Google models for better prompt formatting
    const isGoogleModel = GOOGLE_MODELS.some((m) =>
      DEFAULT_HAIRSTYLE_MODEL.includes(m.replace("fal-ai/", ""))
    );

    // Create prompt based on model type
    // Google models work better with direct editing instructions
    const prompt = isGoogleModel
      ? `Change this ${gender} person's hairstyle to a "${styleDescription}" hairstyle. Keep the exact same face, skin tone, and facial features. Only modify the hair. Professional salon-quality result.`
      : `A professional portrait photo of a ${gender} person with a beautiful "${styleDescription}" hairstyle. 
The person has the exact same face, skin tone, and facial features. 
High quality, photorealistic, natural lighting, salon-quality hair styling.
Keep the background simple and professional.`;

    console.log("Prompt:", prompt);
    console.log("Sending request to Fal AI...");

    // Convert base64 to data URL if needed
    const imageUrl = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    // Build input based on model type
    const input = isGoogleModel
      ? {
          // Google models (Nano Banana Pro / Gemini 3 Pro) use image_urls array
          image_urls: [imageUrl],
          prompt: prompt,
          num_images: 1,
          output_format: "jpeg",
        }
      : {
          // FLUX models use image_url (singular)
          image_url: imageUrl,
          prompt: prompt,
          strength: 0.65,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
          output_format: "jpeg",
          sync_mode: true,
        };

    console.log("Using Google model format:", isGoogleModel);

    // Use image-to-image model
    const result = (await fal.subscribe(DEFAULT_HAIRSTYLE_MODEL, {
      input: input,
      logs: false, // Disable verbose logging to prevent base64 chunks in terminal
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generation in progress...");
        }
      },
    })) as { data: FalImageResult };

    console.log("=== FAL AI RESPONSE RECEIVED ===");
    console.log(
      "Response data:",
      JSON.stringify(result.data, null, 2).substring(0, 1000)
    );

    // Extract image URL from response
    if (result.data?.images && result.data.images.length > 0) {
      const generatedImage = result.data.images[0];
      console.log("✓ Generated image URL:", generatedImage.url);
      return generatedImage.url;
    }

    throw new Error("No image was generated. Please try again.");
  } catch (error: any) {
    console.error("=== FAL AI IMAGE GENERATION ERROR ===");
    console.error("Error:", error?.message || error);

    if (error?.body) {
      console.error("Error body:", JSON.stringify(error.body, null, 2));
    }

    throw new Error(
      error?.message || "Failed to generate hairstyle with Fal AI"
    );
  }
};

/**
 * Generate an image from text prompt only (no input image)
 */
export const generateImageFromPrompt = async (
  prompt: string,
  options?: {
    model?: string;
    width?: number;
    height?: number;
    numImages?: number;
  }
): Promise<string[]> => {
  try {
    const model = options?.model || IMAGE_MODELS.FLUX_SCHNELL;

    console.log("=== STARTING FAL AI TEXT-TO-IMAGE ===");
    console.log("Using model:", model);
    console.log("Prompt:", prompt);

    const result = (await fal.subscribe(model, {
      input: {
        prompt: prompt,
        image_size: {
          width: options?.width || 1024,
          height: options?.height || 1024,
        },
        num_images: options?.numImages || 1,
        enable_safety_checker: true,
        output_format: "jpeg",
        sync_mode: true,
      },
      logs: false,
    })) as { data: FalImageResult };

    console.log("=== FAL AI TEXT-TO-IMAGE RESPONSE ===");

    if (result.data?.images && result.data.images.length > 0) {
      return result.data.images.map((img) => img.url);
    }

    throw new Error("No images were generated");
  } catch (error: any) {
    console.error("=== FAL AI TEXT-TO-IMAGE ERROR ===");
    console.error("Error:", error?.message || error);
    throw error;
  }
};

/**
 * Generate video from image (future feature)
 */
export const generateVideoFromImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    console.log("=== STARTING FAL AI VIDEO GENERATION ===");

    const imageUrl = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    // Using Kling for image-to-video
    const result = (await fal.subscribe(
      "fal-ai/kling-video/v1/standard/image-to-video",
      {
        input: {
          prompt: prompt,
          image_url: imageUrl,
          duration: "5",
        },
        logs: false,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Video generation in progress...");
          }
        },
      }
    )) as { data: { video: { url: string } } };

    console.log("=== FAL AI VIDEO RESPONSE ===");

    if (result.data?.video?.url) {
      return result.data.video.url;
    }

    throw new Error("No video was generated");
  } catch (error: any) {
    console.error("=== FAL AI VIDEO GENERATION ERROR ===");
    console.error("Error:", error?.message || error);
    throw error;
  }
};

export { IMAGE_MODELS };
