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

