import { HairColor, HairLengthFilter } from "../types";

// Hair length filter options
export const HAIR_LENGTH_FILTERS: HairLengthFilter[] = [
  { id: "all", label: "All" },
  { id: "buzz", label: "Buzz" },
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "shoulder", label: "Shoulder" },
  { id: "long", label: "Long" },
];

// Hairstyles categorized by length and gender
export const HAIRSTYLES_BY_LENGTH = {
  male: {
    buzz: [
      "Buzz Cut",
      "Crew Cut",
      "Butch Cut",
      "Induction Cut",
      "High and Tight",
    ],
    short: [
      "Classic Side Part",
      "Textured Crop",
      "French Crop",
      "Ivy League",
      "Caesar Cut",
      "Taper Fade",
      "Skin Fade",
      "Edgar Cut",
    ],
    medium: [
      "Quiff",
      "Pompadour",
      "Slicked Back",
      "Undercut",
      "Textured Fringe",
      "Modern Mullet",
      "Curtain Hair",
      "Messy Textured",
    ],
    shoulder: ["Flow Hairstyle", "Surfer Hair", "Layered Shag", "Bro Flow"],
    long: [
      "Man Bun",
      "Long Layers",
      "Samurai Top Knot",
      "Viking Style",
      "Classic Long",
      "Bohemian Waves",
    ],
  },
  female: {
    buzz: ["Buzz Cut", "Pixie Buzz", "Tapered Buzz"],
    short: [
      "Pixie Cut",
      "Choppy Pixie",
      "Asymmetric Pixie",
      "French Bob",
      "Ear-Length Bob",
      "Bowl Cut Modern",
      "Bixie Cut",
      "Textured Pixie",
    ],
    medium: [
      "Classic Bob",
      "Layered Bob",
      "Blunt Bob",
      "A-Line Bob",
      "Shaggy Bob",
      "Chin-Length Lob",
      "Wavy Bob",
      "Curtain Bangs Bob",
    ],
    shoulder: [
      "Lob (Long Bob)",
      "Shoulder-Length Layers",
      "Shag Cut",
      "Wolf Cut",
      "Butterfly Cut",
      "Curtain Bangs",
      "Textured Layers",
      "Blunt Cut",
    ],
    long: [
      "Long Layers",
      "Face Framing Layers",
      "Beach Waves",
      "Straight Sleek",
      "V-Cut Layers",
      "U-Cut Layers",
      "Feathered Layers",
      "Mermaid Waves",
      "Bohemian Long",
      "Rapunzel Layers",
    ],
  },
} as const;

// ============ PROFESSIONAL HAIRSTYLE DESCRIPTIONS ============
// Detailed salon-professional descriptions for consistent AI generation

export const HAIRSTYLE_DESCRIPTIONS: Record<string, string> = {
  // ============ MALE BUZZ ============
  "Buzz Cut":
    "Ultra-short uniform length all over, clipper cut at #1-#2 guard (3-6mm). Clean, military-inspired cut with visible scalp through hair. Sharp defined hairline at forehead, temples, and nape. No styling required, natural hair texture visible.",

  "Crew Cut":
    "Classic tapered cut with 1-2 inches on top gradually fading shorter on sides. Top hair stands upright with textured finish, sides clipper-faded from #2 at top to #1 at temples. Front hairline slightly longer, brushed forward or to the side. Clean neckline taper.",

  "Butch Cut":
    "Very short uniform buzz, slightly longer than induction cut at #2-#3 guard (6-10mm). Even length throughout with no fade, squared-off hairline. Military regulation style, minimal maintenance cut.",

  "Induction Cut":
    "Shortest possible clipper cut at #0-#1 guard (1-3mm), nearly bald appearance. Uniform length all over with defined sharp hairline. Military boot camp style, scalp clearly visible throughout.",

  "High and Tight":
    "Dramatic contrast cut with longer top (1-2 inches) and extremely short sides/back buzzed to skin or #0 guard. Sharp horizontal demarcation line between top and sides. Top can be styled forward, spiked, or brushed to side.",

  // ============ MALE SHORT ============
  "Classic Side Part":
    "Timeless gentleman's cut with 2-3 inches on top, tapered sides. Deep side part with hair combed smoothly to one side. Gradual fade on sides and back, clean around ears. Polished, professional finish with slight shine from pomade.",

  "Textured Crop":
    "Modern choppy top with 2-3 inches of length, heavy texture throughout. Disconnected undercut or fade on sides. Messy, piece-y finish on top with defined individual strands. Forward-styled fringe with textured ends.",

  "French Crop":
    "Short textured top with signature blunt-cut fringe falling across forehead. Sides faded tight (#1-#2), top kept 1-2 inches with choppy texture. Fringe cut straight across, hitting mid-forehead. European minimal aesthetic.",

  "Ivy League":
    "Longer crew cut variant with 2-3 inches on top allowing side part. Tapered sides with scissor-over-comb finish. Preppy, polished look that can be parted or brushed back. Clean professional appearance.",

  "Caesar Cut":
    "Short horizontal fringe (bangs) with uniform 1-2 inch length on top. Hair brushed forward throughout, fringe sits flat on forehead. Tapered or faded sides, named after Julius Caesar's iconic style.",

  "Taper Fade":
    "Gradual length transition from longer top to shorter sides/back. Top maintains 2-4 inches, sides blend from skin to top length. Seamless gradient effect, clean around ears and neckline. Versatile styling on top.",

  "Skin Fade":
    "Dramatic fade starting at skin (bald) at temples/neckline, blending up to longer top. Sharp contrast between bald lower portion and textured top. High, mid, or low fade variations. Modern barbershop signature cut.",

  "Edgar Cut":
    "Bold statement cut with straight-across blunt fringe, high skin fade on sides. Sharp geometric lines, fringe sits flat and heavy on forehead. Undercut sides with dramatic contrast. Trendy, edgy aesthetic.",

  // ============ MALE MEDIUM ============
  "Quiff":
    "Voluminous front-swept style with 3-4 inches on top, shorter sides. Hair lifted and swept back at front creating height and volume. Tapered or faded sides, back swept smoothly. Classic rockabilly-inspired, modern adaptation.",

  "Pompadour":
    "Iconic volume-focused style with 4-5 inches on top swept up and back. Maximum height at front, gradually tapering back. Sides slicked or faded, dramatic front elevation. Retro glamour meets modern edge.",

  "Slicked Back":
    "All hair combed straight back from forehead with wet-look or matte finish. Medium length 3-4 inches throughout top, tapered sides. Smooth, sleek surface with no part. Sophisticated, polished appearance.",

  "Undercut":
    "Disconnected style with 3-4 inches on top, dramatically short buzzed sides (#0-#1). Sharp line of demarcation between top and sides. Top can be worn slicked back, side-parted, or textured. High contrast look.",

  "Textured Fringe":
    "Choppy, piece-y front with 3-4 inches falling forward onto forehead. Heavy texture throughout with point-cut ends. Faded or tapered sides, messy intentional bedhead styling. Modern, youthful aesthetic.",

  "Modern Mullet":
    "Contemporary take on classic mullet - textured short front and sides with longer back (4-6 inches). Shaggy layers, face-framing pieces, tapered sides. Edgy, fashion-forward revival style.",

  "Curtain Hair":
    "Center-parted medium length (4-5 inches) framing face on both sides. Soft layers with ends flipping outward or tucked behind ears. 90s revival style, effortless romantic aesthetic.",

  "Messy Textured":
    "Intentionally disheveled 3-4 inch length with maximum texture and movement. Choppy layers, piece-y finish, no defined shape. Tousled bedhead appearance with matte product. Effortless casual style.",

  // ============ MALE SHOULDER ============
  "Flow Hairstyle":
    "Shoulder-length (5-7 inches) with natural movement and soft layers. Hair flows freely, often swept back from face. Healthy shine, minimal styling for natural wave pattern. Athletic, surfer-influenced aesthetic.",

  "Surfer Hair":
    "Sun-kissed shoulder-length waves with beachy texture. Natural, undone appearance with salt-spray texture. Layers for movement, often lighter at ends. Relaxed, coastal lifestyle look.",

  "Layered Shag":
    "Heavy layers throughout shoulder-length hair creating volume and movement. Face-framing pieces, choppy ends, 70s rock-inspired texture. Messy, lived-in appearance with maximum body.",

  "Bro Flow":
    "Slicked-back shoulder-length style with volume at crown. Hair swept back off face, tucked behind ears or flowing freely. Polished yet relaxed, requires healthy thick hair.",

  // ============ MALE LONG ============
  "Man Bun":
    "Long hair (8+ inches) gathered and tied at crown or back of head. Can be full bun or half-up style. Clean sides or undercut variation. Practical yet stylish for long hair.",

  "Long Layers":
    "Past-shoulder length with graduated layers for movement. Face-framing pieces, healthy ends, natural texture. Versatile styling options, rock-star influenced aesthetic.",

  "Samurai Top Knot":
    "Traditional Japanese-inspired with undercut sides, long top tied in knot at crown. Sharp contrast between shaved sides and tied-up top. Cultural fusion, warrior aesthetic.",

  "Viking Style":
    "Long, textured hair often with braids or half-up styles. Rugged, masculine appearance with intentional messiness. Can include beard coordination. Norse warrior inspired.",

  "Classic Long":
    "Simple shoulder-length or longer with minimal layers. One-length appearance, natural part, healthy sleek finish. Timeless, uncomplicated long hair look.",

  "Bohemian Waves":
    "Long flowing waves with natural, undone texture. Soft romantic movement, center or side parted. Artistic, free-spirited aesthetic with effortless beauty.",

  // ============ FEMALE BUZZ ============
  "Buzz Cut_female":
    "Bold ultra-short clipper cut at #1-#2 guard. Uniform length showing head shape, defined feminine hairline. Statement androgynous style, emphasizes facial features.",

  "Pixie Buzz":
    "Very short pixie variation with slight length on top (0.5-1 inch). Tapered sides, feminine softness despite short length. Elfin, gamine quality.",

  "Tapered Buzz":
    "Graduated buzz longer at crown, shorter at sides and nape. Soft feminine shape despite extreme shortness. Artistic, editorial-inspired cut.",

  // ============ FEMALE SHORT ============
  "Pixie Cut":
    "Classic short cut with 1-3 inches on top, cropped sides and back. Versatile styling - sleek, textured, or tousled. Feminine yet edgy, emphasizes bone structure.",

  "Choppy Pixie":
    "Heavily textured pixie with razored, piece-y ends. Maximum movement and edge, messy intentional finish. Punk-influenced, modern attitude.",

  "Asymmetric Pixie":
    "Dramatic uneven length - longer on one side, shorter on other. Geometric, avant-garde silhouette. High-fashion editorial statement.",

  "French Bob":
    "Chin-length blunt bob with full fringe (bangs). Parisian chic with clean lines, slight inward curl at ends. Effortlessly sophisticated, timeless elegance.",

  "Ear-Length Bob":
    "Cropped bob hitting just at or above ears. Clean geometric shape, can be blunt or slightly layered. Bold, modern, face-framing cut.",

  "Bowl Cut Modern":
    "Updated bowl shape with soft edges and texture. Rounded silhouette, fringe integrated into shape. Avant-garde, fashion-forward interpretation.",

  "Bixie Cut":
    "Hybrid between bob and pixie - longer than pixie, shorter than bob. Textured, layered, versatile length. Modern transitional style.",

  "Textured Pixie":
    "Pixie with maximum texture and movement. Piece-y, choppy finish with varying lengths. Dimensional, lived-in appearance.",

  // ============ FEMALE MEDIUM ============
  "Classic Bob":
    "Timeless chin-to-jaw length bob with blunt ends. One-length or minimal layers, sleek finish. Can be worn straight or with soft wave. Elegant simplicity.",

  "Layered Bob":
    "Bob with graduated layers adding movement and volume. Face-framing pieces, bouncy finish. Lighter, more dynamic than blunt bob.",

  "Blunt Bob":
    "Sharp, precise one-length cut at chin or jaw. No layers, clean horizontal line. Graphic, modern, high-impact style.",

  "A-Line Bob":
    "Angular bob shorter in back, longer toward face. Graduated cutting creates dramatic angle. Flattering face-framing shape.",

  "Shaggy Bob":
    "Bob with heavy layers and razored texture. 70s-inspired, messy-chic appearance. Maximum volume and movement.",

  "Chin-Length Lob":
    "Longer bob (lob) sitting at chin level. Versatile length for styling variety. Modern classic, universally flattering.",

  "Wavy Bob":
    "Bob styled with soft waves or curls. Romantic, beachy texture. Can be natural wave or heat-styled.",

  "Curtain Bangs Bob":
    "Bob featuring face-framing curtain bangs parted at center. 70s-inspired, soft feminine framing. Universally flattering addition.",

  // ============ FEMALE SHOULDER ============
  "Lob (Long Bob)":
    "Collarbone-length bob - longer than classic bob, shorter than long hair. Versatile, low-maintenance, modern staple. Blunt or slightly layered ends.",

  "Shoulder-Length Layers":
    "Hair hitting shoulders with graduated layers throughout. Movement and volume, face-framing pieces. Classic versatile length.",

  "Shag Cut":
    "Heavy layering creating volume at crown, wispy ends. 70s rock-inspired, lots of movement. Face-framing bangs often included.",

  "Wolf Cut":
    "Mullet-shag hybrid with heavy layers and face-framing. Shorter at crown, longer at back and sides. Edgy, viral TikTok-famous style.",

  "Butterfly Cut":
    "Dramatic face-framing layers creating butterfly wing effect. Shorter layers at face, longer underneath. Voluminous, bouncy silhouette.",

  "Curtain Bangs":
    "Shoulder-length with signature center-parted face-framing bangs. Soft, feathered pieces framing cheekbones. 70s revival, universally flattering.",

  "Textured Layers":
    "Shoulder-length with choppy, piece-y layers throughout. Maximum texture and movement. Effortless, lived-in aesthetic.",

  "Blunt Cut":
    "One-length shoulder cut with no layers. Clean, sharp horizontal line. Sleek, polished, modern minimalism.",

  // ============ FEMALE LONG ============
  "Long Layers":
    "Long hair with graduated layers starting mid-length. Movement and body without sacrificing length. Classic versatile style.",

  "Face Framing Layers":
    "Long hair with shorter pieces framing face. Subtle dimension, flattering around features. Soft, romantic effect.",

  "Beach Waves":
    "Long hair with relaxed, tousled wave pattern. Salt-spray texture, sun-kissed appearance. Effortless coastal beauty.",

  "Straight Sleek":
    "Long, pin-straight hair with mirror-like shine. One-length or minimal layers, polished finish. Sophisticated, high-maintenance glamour.",

  "V-Cut Layers":
    "Long layers cut to form V-shape at back. Dramatic point at center back, graduated sides. Adds interest to long hair.",

  "U-Cut Layers":
    "Long layers forming soft U-shape at back. Rounded, softer alternative to V-cut. Classic, natural appearance.",

  "Feathered Layers":
    "Long hair with soft, wispy layered ends flipping outward. 70s Farrah Fawcett-inspired. Bouncy, voluminous finish.",

  "Mermaid Waves":
    "Long flowing waves with maximum length and romance. Fairy-tale inspired, cascading curls. Fantasy, ethereal beauty.",

  "Bohemian Long":
    "Long, natural-textured hair with effortless styling. Soft waves, center part, artistic vibe. Free-spirited, organic beauty.",

  "Rapunzel Layers":
    "Extra-long hair with minimal layers. Fairy-tale length, healthy sleek finish. Statement length, high maintenance.",
};

/**
 * Get the professional description for a hairstyle
 * Falls back to generic description if not found
 */
export const getHairstyleDescription = (
  styleName: string,
  gender: string
): string => {
  // Try gender-specific key first (for styles like "Buzz Cut" that differ by gender)
  const genderKey = `${styleName}_${gender}`;
  if (HAIRSTYLE_DESCRIPTIONS[genderKey]) {
    return HAIRSTYLE_DESCRIPTIONS[genderKey];
  }
  // Try generic key
  if (HAIRSTYLE_DESCRIPTIONS[styleName]) {
    return HAIRSTYLE_DESCRIPTIONS[styleName];
  }
  // Fallback
  return `${styleName} hairstyle, professionally cut and styled`;
};

// Natural hair colors
export const HAIR_COLORS: HairColor[] = [
  { id: "natural", name: "Natural", color: null },
  { id: "jetBlack", name: "Jet Black", color: "#0a0a0a" },
  { id: "naturalBlack", name: "Black", color: "#1a1a1a" },
  { id: "darkBrown", name: "Dark Brown", color: "#3d2314" },
  { id: "chocolateBrown", name: "Chocolate", color: "#4a3728" },
  { id: "chestnut", name: "Chestnut", color: "#954535" },
  { id: "auburn", name: "Auburn", color: "#922724" },
  { id: "mediumBrown", name: "Med Brown", color: "#6b4423" },
  { id: "lightBrown", name: "Light Brown", color: "#8b5a2b" },
  { id: "caramel", name: "Caramel", color: "#a67b5b" },
  { id: "honeyBlonde", name: "Honey", color: "#c9a86c" },
  { id: "goldenBlonde", name: "Golden", color: "#d4a574" },
  { id: "ashBlonde", name: "Ash", color: "#c2b280" },
  { id: "platinumBlonde", name: "Platinum", color: "#e8e4c9" },
  { id: "strawberryBlonde", name: "Strawberry", color: "#cc7a5f" },
  { id: "ginger", name: "Ginger", color: "#b55239" },
  { id: "copper", name: "Copper", color: "#b87333" },
  { id: "silver", name: "Silver", color: "#a8a8a8" },
];

