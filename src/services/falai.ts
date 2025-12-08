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
  // Google edit models - Best for character consistency
  NANO_BANANA_PRO: "fal-ai/nano-banana-pro/edit",
  GEMINI_3_PRO: "fal-ai/gemini-3-pro-image-preview/edit",
};

// Models that use image_url (singular) instead of image_urls (array)
const MODELS_USING_SINGULAR_IMAGE_URL = [
  "flux/dev/image-to-image",
  "flux-dev-image-to-image",
  "flux/schnell",
  "hair-change",
  "image-editing",
];

// Models that require @Image1, @Image2 syntax in prompt (Kling models)
const MODELS_USING_IMAGE_REFERENCE_SYNTAX = [
  "kling-image",
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
 * @param base64Image - User's photo (base64 or data URL)
 * @param styleDescription - Text description of target hairstyle (already includes full prompt)
 * @param gender - User's gender
 * @param referenceImageUrl - Optional reference image URL for style transfer
 */
export const generateHairstyle = async (
  base64Image: string,
  styleDescription: string,
  gender: string,
  referenceImageUrl?: string
): Promise<string> => {
  try {
    console.log("=== STARTING FAL AI IMAGE GENERATION ===");
    console.log("Using model:", DEFAULT_HAIRSTYLE_MODEL);
    console.log("Reference image provided:", !!referenceImageUrl);

    // Check if model uses singular image_url
    const usesSingularImageUrl = MODELS_USING_SINGULAR_IMAGE_URL.some(
      (keyword) =>
        DEFAULT_HAIRSTYLE_MODEL.toLowerCase().includes(keyword.toLowerCase())
    );
    const usesImageUrlsArray = !usesSingularImageUrl;

    // Check if model uses @Image1 reference syntax (Kling models)
    const usesImageReferenceSyntax = MODELS_USING_IMAGE_REFERENCE_SYNTAX.some(
      (keyword) =>
        DEFAULT_HAIRSTYLE_MODEL.toLowerCase().includes(keyword.toLowerCase())
    );

    console.log("Model:", DEFAULT_HAIRSTYLE_MODEL);
    console.log("Uses image_urls array:", usesImageUrlsArray);
    console.log("Uses @Image reference syntax:", usesImageReferenceSyntax);

    // Build prompt - Kling models need @Image1 syntax to reference input images
    let prompt = styleDescription;
    if (usesImageReferenceSyntax) {
      // For Kling: Use @Image1, @Image2 reference syntax
      if (referenceImageUrl) {
        // With reference image: apply ref style to user's photo
        prompt = `Transform @Image1 by applying the exact hairstyle shown in @Image2. 

${styleDescription}

CRITICAL: The person in @Image1 must remain completely identical - same face, features, expression, skin, body, background. ONLY replace the hair with the style from @Image2.`;
      } else {
        // Without reference: just modify @Image1
        prompt = `Transform the hair in @Image1 while keeping everything else identical.

${styleDescription}

CRITICAL: The person must remain completely identical - same face, features, expression, skin, body, background. ONLY the hair should change.`;
      }
    }

    console.log("Prompt:", prompt);
    console.log("Sending request to Fal AI...");
    console.log("Base64 image length:", base64Image?.length || 0);

    // Validate base64 image
    if (!base64Image || base64Image.length < 100) {
      throw new Error("Invalid or missing base64 image data");
    }

    // Convert base64 to data URL if needed
    const imageUrl = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    // Build image_urls array - include reference image if provided
    const imageUrls = referenceImageUrl
      ? [imageUrl, referenceImageUrl]
      : [imageUrl];

    console.log("Image URL length:", imageUrl.length);
    console.log("Image URLs array length:", imageUrls.length);

    // Build input based on model type
    const input = usesImageUrlsArray
      ? {
          // Models using image_urls array (Google, edit models, etc.)
          image_urls: imageUrls,
          prompt: prompt,
          num_images: 1,
          output_format: "jpeg",
        }
      : {
          // FLUX models use image_url (singular)
          image_url: imageUrl,
          prompt: prompt,
          strength: 0.55, // Lower strength to preserve face better
          num_inference_steps: 30,
          guidance_scale: 4.0,
          num_images: 1,
          enable_safety_checker: true,
          output_format: "jpeg",
          sync_mode: true,
        };

    console.log(
      "Input format:",
      usesImageUrlsArray ? "image_urls array" : "image_url singular"
    );

    // Use image-to-image model
    const result = (await fal.subscribe(DEFAULT_HAIRSTYLE_MODEL, {
      input: input,
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generation in progress...");
        }
      },
    })) as { data: FalImageResult };

    console.log("=== FAL AI RESPONSE RECEIVED ===");

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

export { IMAGE_MODELS };
