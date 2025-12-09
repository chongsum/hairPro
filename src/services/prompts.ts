/**
 * ============================================================
 * HAIRPRO - CENTRALIZED PROMPT MANAGEMENT
 * ============================================================
 *
 * This file contains ALL prompts used in the app.
 * Edit prompts here to change AI behavior across the app.
 *
 * APP FLOW OVERVIEW:
 * ==================
 *
 * MODELS USED:
 * - EXPO_PUBLIC_AI_VISION_MODEL: Hair analysis (user photo + ref image)
 * - EXPO_PUBLIC_FAL_IMAGE_MODEL: Hairstyle generation on user photo
 *
 * PATH 1: STYLE SELECTION
 * -----------------------
 * 1. User uploads photo → analyzeUserHair()
 * 2. User selects style → stored description from constants
 * 3. Generate → user photo + text description
 *
 * PATH 2: REFERENCE IMAGE
 * -----------------------
 * 1. User uploads photo → analyzeUserHair()
 * 2. User uploads ref image → vision AI analyzes hairstyle → text description
 * 3. Generate → user photo + text description
 *
 * ============================================================
 */

// ============================================================
// 1. USER HAIR ANALYSIS PROMPT
// ============================================================
// Used by: src/services/openrouter.ts → analyzeHair()
// Model: EXPO_PUBLIC_AI_VISION_MODEL
// Purpose: Analyze user's current hair properties for natural-looking results

export const buildUserHairAnalysisPrompt = (
  gender: string
): string => `Analyze this ${gender} client's hair for a salon consultation.

Return ONLY this JSON (no other text):
{
  "hairTexture": {"value": "<straight|wavy|curly|coily>"},
  "hairDensity": {"value": "<thin|medium|thick>"},
  "faceShape": {"value": "<oval|round|square|heart|oblong|diamond>"},
  "hairLength": {"value": "<very short|short|medium|long|very long>"},
  "hairColor": {"value": "<brief color description>"}
}`;

// ============================================================
// 2. REFERENCE IMAGE ANALYSIS PROMPT
// ============================================================
// Used by: src/services/refImageAnalysis.ts → analyzeRefImageHairstyle()
// Model: EXPO_PUBLIC_AI_VISION_MODEL
// Purpose: Analyze hairstyle in user-uploaded reference image

export const REF_IMAGE_ANALYSIS_PROMPT = `You are a professional hairstylist and AI image generation prompt engineer. Analyze this reference hairstyle image and create a detailed description that will be used to apply this exact hairstyle to a different person via AI image generation.

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

// ============================================================
// 3. HAIRSTYLE GENERATION PROMPT
// ============================================================
// Used by: App.tsx → generateImages()
// Model: EXPO_PUBLIC_FAL_IMAGE_MODEL
// Purpose: Generate the virtual hair try-on image
//
// This is the MAIN prompt used for both paths:
// - Path 1 (Style Selection): targetHairstyleDescription = stored description from constants
// - Path 2 (Ref Image): targetHairstyleDescription = vision AI analysis of ref image

export const buildHairstyleGenerationPrompt = (params: {
  userHairAnalysis: string;
  targetHairstyleDescription: string;
  hairColor: string;
  gender: string;
}): string => {
  const { userHairAnalysis, targetHairstyleDescription, hairColor, gender } =
    params;

  const isNaturalColor =
    !hairColor || hairColor === "natural" || hairColor === "Natural";
  const colorInstruction = isNaturalColor
    ? "KEEP the person's original/natural hair color exactly as-is"
    : `Change hair color to ${hairColor}`;

  return `TASK: Professional virtual hairstyle try-on. Transform ONLY the hair to show: ${targetHairstyleDescription}.

HAIR COLOR: ${colorInstruction}

HAIR REQUIREMENTS:
- Photorealistic, salon-quality ${
    gender === "female" ? "women's" : "men's"
  } hairstyle
- Natural hair physics: proper weight, gravity, volume, and movement
- Realistic hair texture with individual strand detail and natural shine
- Seamless blend at hairline, temples, and nape
- Style must be practically achievable by a professional hairstylist
${
  userHairAnalysis
    ? `- ADAPT the hairstyle to work naturally with this person's hair: ${userHairAnalysis}`
    : ""
}

STRICT PRESERVATION (DO NOT MODIFY):
- Face: Keep exact facial features, skin tone and color, expression, makeup unchanged
- No face enhancement, beautification, smoothing, or reshaping
- Eyes, eyebrows, nose, ears, lips must remain identical to original
- Body, clothing, jewelry, accessories unchanged
- Background and lighting unchanged
- Image composition and framing unchanged
${
  isNaturalColor
    ? "- Hair color: MUST remain the person's original/natural hair color"
    : ""
}

OUTPUT: Single photorealistic image showing only the new hairstyle applied naturally to this exact person.`;
};

// ============================================================
// 4. MODEL-SPECIFIC PROMPT WRAPPERS
// ============================================================
// All models use TEXT DESCRIPTION ONLY (user photo + hairstyle description)

/**
 * Wrap prompt for Kling models
 * Kling requires @Image syntax to reference input images
 */
export const wrapForKlingModel = (basePrompt: string): string => {
  return `Edit the person in @Image: ${basePrompt}`;
};

/**
 * Wrap prompt for Nano Banana / Gemini models
 */
export const wrapForNanoBananaModel = (basePrompt: string): string => {
  return basePrompt;
};

/**
 * Wrap prompt for FLUX models
 */
export const wrapForFluxModel = (basePrompt: string): string => {
  return basePrompt;
};
