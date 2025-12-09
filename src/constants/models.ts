/**
 * ============================================================
 * SUPPORTED IMAGE-TO-IMAGE MODELS
 * ============================================================
 * 
 * Add new models here to make them available in the app.
 * The app will allow users to switch between these models.
 */

export interface ImageModel {
  id: string;
  name: string;
  description: {
    en: string;
    "zh-TW": string;
  };
  // Model endpoint for Fal AI
  endpoint: string;
  // Model type for prompt wrapping
  type: "flux" | "kling" | "nano-banana" | "other";
  // Whether model uses image_url (single) or image_urls (array)
  inputFormat: "single" | "array";
}

export const SUPPORTED_MODELS: ImageModel[] = [
  {
    id: "kling-o1",
    name: "Kling O1",
    description: {
      en: "High quality image editing with excellent face preservation",
      "zh-TW": "高品質圖像編輯，優秀的面部保留",
    },
    endpoint: "fal-ai/kling-image/o1",
    type: "kling",
    inputFormat: "array",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    description: {
      en: "Fast and efficient image editing",
      "zh-TW": "快速高效的圖像編輯",
    },
    endpoint: "fal-ai/nano-banana/edit",
    type: "nano-banana",
    inputFormat: "array",
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    description: {
      en: "Enhanced version with better quality",
      "zh-TW": "增強版本，品質更佳",
    },
    endpoint: "fal-ai/nano-banana-pro/edit",
    type: "nano-banana",
    inputFormat: "array",
  },
  {
    id: "flux-kontext",
    name: "Flux Kontext",
    description: {
      en: "Professional quality transformations",
      "zh-TW": "專業品質轉換",
    },
    endpoint: "fal-ai/flux-pro/kontext",
    type: "flux",
    inputFormat: "single",
  },
  {
    id: "flux-kontext-max",
    name: "Flux Kontext Max",
    description: {
      en: "Maximum quality with Flux technology",
      "zh-TW": "Flux 技術最高品質",
    },
    endpoint: "fal-ai/flux-pro/kontext/max",
    type: "flux",
    inputFormat: "single",
  },
];

// Default model ID
export const DEFAULT_MODEL_ID = "kling-o1";

// Get model by ID
export const getModelById = (id: string): ImageModel | undefined => {
  return SUPPORTED_MODELS.find((model) => model.id === id);
};

// Get default model
export const getDefaultModel = (): ImageModel => {
  return getModelById(DEFAULT_MODEL_ID) || SUPPORTED_MODELS[0];
};

