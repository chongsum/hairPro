import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Animated,
  Alert,
  SafeAreaView,
  Easing,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { CameraView, useCameraPermissions } from "expo-camera";
import { generateHairstyle } from "./src/services/falai";
import { analyzeHair, HairAnalysis } from "./src/services/openrouter";
import axios from "axios";

// Demo image for development
const DEMO_FRONT_IMAGE = require("./assets/demo_front.jpg");

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Screen types for navigation - simplified flow
type Screen =
  | "initial" // Combined gender + flow choice
  | "photoCapture" // Take/upload photo
  | "photoConfirm" // Preview and confirm photo
  | "styleSelect" // Path A: Style selection with color picker
  | "refUpload" // Path B: Ref image upload with color picker
  | "generating" // Generating preview
  | "result"; // Final result comparison

type Gender = "male" | "female";
type FlowType = "ref" | "style";

// Hair length options with filter categories
const HAIR_LENGTH_FILTERS = [
  { id: "all", label: "All" },
  { id: "buzz", label: "Buzz" },
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "shoulder", label: "Shoulder" },
  { id: "long", label: "Long" },
];

// Hairstyles categorized by length and gender
const HAIRSTYLES_BY_LENGTH = {
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
};

// Natural hair colors
const HAIR_COLORS = [
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

// OpenRouter API for vision analysis of reference image
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
const analyzeRefImageHairstyle = async (
  imageBase64OrUrl: string
): Promise<string> => {
  const prompt = `Analyze this hairstyle image in detail for hair styling purposes.

Describe the hairstyle with specific details including:
- Hair length and layers
- Texture and volume
- Bangs/fringe style if any
- Parting and overall shape
- Any special styling techniques visible

Provide a concise but detailed description (2-3 sentences) that could be used as a prompt to recreate this hairstyle. Focus only on the hair, not the person's face or other features.`;

  const imageContent =
    imageBase64OrUrl.startsWith("data:") || imageBase64OrUrl.startsWith("http")
      ? imageBase64OrUrl
      : `data:image/jpeg;base64,${imageBase64OrUrl}`;

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
    max_tokens: 512,
    temperature: 0.3,
  });

  return (
    response.data.choices[0]?.message?.content || "Unable to analyze hairstyle"
  );
};

/**
 * Resize and compress image to ~1024px max dimension and reduce quality
 */
const resizeAndCompressImage = async (
  uri: string
): Promise<{ uri: string; base64: string }> => {
  try {
    console.log("Resizing and compressing image...");

    // Resize to max 1024px on longest side and compress to 30% quality
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }], // Resize width to 1024, height auto-scales
      {
        compress: 0.3, // 30% quality for smaller file size
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    const base64 = manipulated.base64 || "";
    console.log(
      `Compressed image: ${Math.round((base64.length * 0.75) / 1024)}KB`
    );

    return { uri: manipulated.uri, base64 };
  } catch (error) {
    console.error("Image compression error:", error);
    // Fallback: return original with empty base64 (will fail gracefully)
    return { uri, base64: "" };
  }
};

// Main App Component
export default function App() {
  // Navigation state
  const [screen, setScreen] = useState<Screen>("initial");
  const [flowType, setFlowType] = useState<FlowType>("style");

  // User preferences
  const [gender, setGender] = useState<Gender>("female");

  // Image state
  const [userPhoto, setUserPhoto] = useState<{
    uri: string;
    base64: string;
  } | null>(null);

  // Reference image state (for ref flow)
  const [refImage, setRefImage] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);
  const [refImageDescription, setRefImageDescription] = useState<string>("");
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);

  // Analysis states
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysis | null>(null);

  // Style selection states
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("natural");
  const [selectedLengthFilter, setSelectedLengthFilter] =
    useState<string>("all");

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState<string>("");

  // Camera refs
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorScrollRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [screen]);

  // Get filtered hairstyles
  const getFilteredHairstyles = useCallback(() => {
    const allStyles = HAIRSTYLES_BY_LENGTH[gender];
    if (selectedLengthFilter === "all") {
      // Return all hairstyles flattened
      return Object.values(allStyles).flat();
    }
    return allStyles[selectedLengthFilter as keyof typeof allStyles] || [];
  }, [gender, selectedLengthFilter]);

  // Generate hairstyle images
  const generateImages = useCallback(async () => {
    if (!userPhoto?.base64) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep("Preparing your photo...");
    setScreen("generating");

    try {
      // Step 1: Analyze hair (0-30%)
      setGenerationStep("Analyzing your hair characteristics...");

      // Progress animation for analysis phase
      const progressInterval1 = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 1, 30));
      }, 600);

      let analysis: HairAnalysis | null = null;
      try {
        analysis = await analyzeHair(
          userPhoto.base64,
          userPhoto.base64,
          gender
        );
        setHairAnalysis(analysis);
      } catch (err) {
        console.error("Hair analysis failed:", err);
      }

      clearInterval(progressInterval1);
      setGenerationProgress(30);

      // Step 2: Build prompt and generate (30-95%)
      setGenerationStep("Creating your new hairstyle...");

      // Build prompt based on flow type
      let styleDescription = "";

      if (flowType === "ref" && refImageDescription) {
        // Reference image flow - use the analyzed description
        styleDescription = refImageDescription;
      } else {
        // Style selection flow
        styleDescription = `${selectedStyle} hairstyle`;
      }

      // Add color if not natural
      const colorName =
        HAIR_COLORS.find((c) => c.id === selectedColor)?.name || "";
      if (colorName && colorName !== "Natural") {
        styleDescription += `, ${colorName} hair color`;
      }

      // Add hair analysis context for more realistic generation
      if (analysis) {
        styleDescription += `. Current hair: ${analysis.hairTexture.value} texture, ${analysis.hairDensity.value} density`;
        if (analysis.faceShape.value) {
          styleDescription += `, ${analysis.faceShape.value} face shape`;
        }
      }

      console.log("Generation prompt:", styleDescription);

      // Progress animation for generation phase
      const progressInterval2 = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 1, 95));
      }, 700);

      const result = await generateHairstyle(
        userPhoto.base64,
        styleDescription,
        gender,
        flowType === "ref" && refImage?.uri ? refImage.uri : undefined
      );

      clearInterval(progressInterval2);
      setGenerationProgress(100);
      setGenerationStep("Complete!");
      setGeneratedImage(result);

      // Small delay before showing result
      setTimeout(() => {
        setScreen("result");
      }, 500);
    } catch (error: any) {
      Alert.alert(
        "Generation Error",
        error.message || "Failed to generate hairstyle image"
      );
      setScreen(flowType === "style" ? "styleSelect" : "refUpload");
    } finally {
      setIsGenerating(false);
    }
  }, [
    userPhoto,
    selectedStyle,
    selectedColor,
    gender,
    flowType,
    refImage,
    refImageDescription,
  ]);

  // Camera capture function
  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8, // Capture at reasonable quality, we'll compress after
      });

      if (photo) {
        // Resize and compress the image
        const compressed = await resizeAndCompressImage(photo.uri);
        setUserPhoto(compressed);
        setShowCamera(false);

        // Navigate to photo confirmation screen
        setScreen("photoConfirm");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1, // Full quality, we'll compress after
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Resize and compress the image
        const compressed = await resizeAndCompressImage(asset.uri);
        setUserPhoto(compressed);

        // Navigate to photo confirmation screen
        setScreen("photoConfirm");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick image");
    }
  };

  // Pick reference image
  const pickRefImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1, // Full quality, we'll compress after
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Resize and compress the reference image
        const compressed = await resizeAndCompressImage(asset.uri);
        setRefImage({
          uri: compressed.uri,
          base64: compressed.base64,
        });

        // Analyze the reference image
        analyzeRefImage(compressed.base64);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick reference image");
    }
  };

  // Analyze reference image hairstyle
  const analyzeRefImage = async (imageData: string) => {
    setIsAnalyzingRef(true);
    try {
      const description = await analyzeRefImageHairstyle(imageData);
      setRefImageDescription(description);
    } catch (error) {
      console.error("Failed to analyze reference image:", error);
      setRefImageDescription("Unable to analyze hairstyle from image");
    } finally {
      setIsAnalyzingRef(false);
    }
  };

  // Reset app state
  const resetApp = () => {
    setScreen("initial");
    setFlowType("style");
    setUserPhoto(null);
    setRefImage(null);
    setRefImageDescription("");
    setHairAnalysis(null);
    setSelectedStyle("");
    setSelectedColor("natural");
    setSelectedLengthFilter("all");
    setGeneratedImage(null);
    setGenerationProgress(0);
    setShowCamera(false);
  };

  // Use demo photo for development/testing
  const useDemoPhoto = async () => {
    try {
      const resolved = Image.resolveAssetSource(DEMO_FRONT_IMAGE);
      const uri = resolved.uri;

      console.log("Loading demo photo from:", uri);

      // Fetch the image and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const b64 = dataUrl.split(",")[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log(
        `Demo photo loaded: ${Math.round((base64.length * 0.75) / 1024)}KB`
      );

      // Use directly without compression (demo only)
      setUserPhoto({ uri, base64 });
      setScreen("photoConfirm");
    } catch (error) {
      console.error("Error loading demo photo:", error);
      Alert.alert("Error", "Failed to load demo photo.");
    }
  };

  // ============ SCREENS ============

  // INITIAL SCREEN - Combined Gender + Flow Choice
  if (screen === "initial") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.initialContent}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>✂️</Text>
            <Text style={styles.logoTitle}>HairPro</Text>
            <Text style={styles.logoSubtitle}>AI Hairstyle Preview</Text>
          </View>

          {/* Gender Selection */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionLabel}>I am</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === "female" && styles.genderPillActive,
                ]}
                onPress={() => setGender("female")}
              >
                <Text style={styles.genderEmoji}>👩</Text>
                <Text
                  style={[
                    styles.genderText,
                    gender === "female" && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === "male" && styles.genderPillActive,
                ]}
                onPress={() => setGender("male")}
              >
                <Text style={styles.genderEmoji}>👨</Text>
                <Text
                  style={[
                    styles.genderText,
                    gender === "male" && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Flow Type Selection */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionLabel}>I want to</Text>

            <TouchableOpacity
              style={[
                styles.flowCard,
                flowType === "style" && styles.flowCardActive,
              ]}
              onPress={() => setFlowType("style")}
            >
              <View style={styles.flowCardIcon}>
                <Text style={styles.flowEmoji}>✨</Text>
              </View>
              <View style={styles.flowCardContent}>
                <Text style={styles.flowCardTitle}>Browse Styles</Text>
                <Text style={styles.flowCardDesc}>
                  Choose from our curated collection of hairstyles
                </Text>
              </View>
              {flowType === "style" && (
                <View style={styles.flowCardCheck}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.flowCard,
                flowType === "ref" && styles.flowCardActive,
              ]}
              onPress={() => setFlowType("ref")}
            >
              <View style={styles.flowCardIcon}>
                <Text style={styles.flowEmoji}>📷</Text>
              </View>
              <View style={styles.flowCardContent}>
                <Text style={styles.flowCardTitle}>Use Reference Image</Text>
                <Text style={styles.flowCardDesc}>
                  Upload a photo of the hairstyle you want
                </Text>
              </View>
              {flowType === "ref" && (
                <View style={styles.flowCardCheck}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen("photoCapture")}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PHOTO CAPTURE SCREEN
  if (screen === "photoCapture") {
    if (showCamera) {
      if (!permission?.granted) {
        return (
          <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.centerContent}>
              <Text style={styles.permissionText}>
                Camera permission is required
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={requestPermission}
              >
                <Text style={styles.primaryButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      }

      return (
        <View style={styles.cameraContainer}>
          <StatusBar style="light" />
          <CameraView ref={cameraRef} style={styles.camera} facing="front">
            {/* Face guide overlay */}
            <View style={styles.cameraOverlay}>
              <View style={styles.faceGuide} />
              <Text style={styles.cameraHint}>
                Position your face in the circle
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cameraBackBtn}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cameraBackText}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={capturePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.cameraPlaceholder} />
            </View>
          </CameraView>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.photoCaptureContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen("initial")}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Take Your Photo</Text>
          <Text style={styles.screenSubtitle}>
            We need a clear front-facing photo of you
          </Text>

          {/* Photo Options */}
          <View style={styles.photoOptions}>
            <TouchableOpacity
              style={styles.photoOptionCard}
              onPress={async () => {
                if (!permission?.granted) {
                  const result = await requestPermission();
                  if (!result.granted) {
                    Alert.alert("Camera access required");
                    return;
                  }
                }
                setShowCamera(true);
              }}
            >
              <Text style={styles.photoOptionIcon}>📸</Text>
              <Text style={styles.photoOptionTitle}>Take Selfie</Text>
              <Text style={styles.photoOptionDesc}>Use your camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoOptionCard}
              onPress={pickImage}
            >
              <Text style={styles.photoOptionIcon}>🖼️</Text>
              <Text style={styles.photoOptionTitle}>Upload Photo</Text>
              <Text style={styles.photoOptionDesc}>From your gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>📋 For Best Results</Text>
            <Text style={styles.tipItem}>• Good, even lighting</Text>
            <Text style={styles.tipItem}>• Face the camera directly</Text>
            <Text style={styles.tipItem}>
              • Show your full face and hairline
            </Text>
            <Text style={styles.tipItem}>• Neutral background preferred</Text>
          </View>

          {/* Demo Button */}
          <TouchableOpacity style={styles.demoButton} onPress={useDemoPhoto}>
            <Text style={styles.demoButtonText}>🧪 Use Demo Photo (Dev)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // PHOTO CONFIRMATION SCREEN
  if (screen === "photoConfirm") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.photoConfirmContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setUserPhoto(null);
              setScreen("photoCapture");
            }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Confirm Your Photo</Text>
          <Text style={styles.screenSubtitle}>
            Make sure your face and hair are clearly visible
          </Text>

          {/* Photo Preview */}
          <View style={styles.photoConfirmPreview}>
            {userPhoto && (
              <Image
                source={{ uri: userPhoto.uri }}
                style={styles.photoConfirmImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Actions */}
          <View style={styles.photoConfirmActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setUserPhoto(null);
                setScreen("photoCapture");
              }}
            >
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmPhotoButton}
              onPress={() => {
                setScreen(flowType === "style" ? "styleSelect" : "refUpload");
              }}
            >
              <Text style={styles.confirmPhotoButtonText}>Looks Good ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // STYLE SELECT SCREEN (Path A)
  if (screen === "styleSelect") {
    const filteredStyles = getFilteredHairstyles();

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.styleSelectContainer}>
          {/* Header */}
          <View style={styles.styleHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setUserPhoto(null);
                setScreen("photoCapture");
              }}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitleSmall}>Choose Your Style</Text>
          </View>

          {/* Color Picker - Horizontal Swipable */}
          <View style={styles.colorPickerSection}>
            <Text style={styles.colorPickerLabel}>Hair Color</Text>
            <FlatList
              ref={colorScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={HAIR_COLORS}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.colorPickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.colorChip,
                    selectedColor === item.id && styles.colorChipActive,
                  ]}
                  onPress={() => setSelectedColor(item.id)}
                >
                  {item.color ? (
                    <View
                      style={[styles.colorDot, { backgroundColor: item.color }]}
                    />
                  ) : (
                    <View style={styles.colorDotNatural}>
                      <Text style={styles.colorDotNaturalText}>🎨</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.colorChipText,
                      selectedColor === item.id && styles.colorChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Length Filter */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {HAIR_LENGTH_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    selectedLengthFilter === filter.id &&
                      styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedLengthFilter(filter.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedLengthFilter === filter.id &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Hairstyles Grid */}
          <ScrollView
            style={styles.stylesScrollView}
            contentContainerStyle={styles.stylesGrid}
          >
            {filteredStyles.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.styleCard,
                  selectedStyle === style && styles.styleCardActive,
                ]}
                onPress={() => setSelectedStyle(style)}
              >
                {/* Placeholder for AI preview */}
                <View style={styles.stylePreviewPlaceholder}>
                  <Text style={styles.stylePreviewIcon}>💇</Text>
                </View>
                <Text
                  style={[
                    styles.styleCardText,
                    selectedStyle === style && styles.styleCardTextActive,
                  ]}
                  numberOfLines={2}
                >
                  {style}
                </Text>
                {selectedStyle === style && (
                  <View style={styles.styleCardCheck}>
                    <Text style={styles.checkMarkSmall}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Generate Button */}
          {selectedStyle && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateImages}
            >
              <Text style={styles.generateButtonText}>Generate Preview ✨</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // REF UPLOAD SCREEN (Path B)
  if (screen === "refUpload") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.refUploadContent}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setUserPhoto(null);
              setRefImage(null);
              setRefImageDescription("");
              setScreen("photoCapture");
            }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Reference Hairstyle</Text>
          <Text style={styles.screenSubtitle}>
            Upload or paste a URL of the hairstyle you want
          </Text>

          {/* Color Picker - Horizontal Swipable */}
          <View style={styles.colorPickerSection}>
            <Text style={styles.colorPickerLabel}>Target Hair Color</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={HAIR_COLORS}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.colorPickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.colorChip,
                    selectedColor === item.id && styles.colorChipActive,
                  ]}
                  onPress={() => setSelectedColor(item.id)}
                >
                  {item.color ? (
                    <View
                      style={[styles.colorDot, { backgroundColor: item.color }]}
                    />
                  ) : (
                    <View style={styles.colorDotNatural}>
                      <Text style={styles.colorDotNaturalText}>🎨</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.colorChipText,
                      selectedColor === item.id && styles.colorChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Reference Image Section */}
          <View style={styles.refImageSection}>
            {refImage ? (
              <View style={styles.refPreviewContainer}>
                <Image
                  source={{ uri: refImage.uri }}
                  style={styles.refPreviewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.refRemoveBtn}
                  onPress={() => {
                    setRefImage(null);
                    setRefImageDescription("");
                  }}
                >
                  <Text style={styles.refRemoveText}>✕</Text>
                </TouchableOpacity>

                {/* Analysis Status */}
                {isAnalyzingRef && (
                  <View style={styles.refAnalyzingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.refAnalyzingText}>
                      Analyzing hairstyle...
                    </Text>
                  </View>
                )}

                {/* Description */}
                {refImageDescription && !isAnalyzingRef && (
                  <View style={styles.refDescriptionBox}>
                    <Text style={styles.refDescriptionLabel}>AI Analysis:</Text>
                    <Text style={styles.refDescriptionText}>
                      {refImageDescription}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Upload Button */}
                <TouchableOpacity
                  style={styles.refUploadCard}
                  onPress={pickRefImage}
                >
                  <Text style={styles.refUploadIcon}>📷</Text>
                  <Text style={styles.refUploadText}>
                    Upload Reference Image
                  </Text>
                </TouchableOpacity>

                {/* URL Input */}
                <Text style={styles.orDivider}>— or paste URL —</Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://example.com/hairstyle.jpg"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={(e) => {
                    const url = e.nativeEvent.text;
                    if (url.startsWith("http")) {
                      setRefImage({ uri: url });
                      analyzeRefImage(url);
                    }
                  }}
                />
              </>
            )}
          </View>

          {/* Important Notice */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>For Best Results</Text>
              <Text style={styles.warningText}>
                • Use a close-up face shot showing the full hairstyle{"\n"}•
                Front-facing reference images work best{"\n"}• Ensure the hair
                is clearly visible{"\n"}• Side or angled photos may produce less
                accurate results
              </Text>
            </View>
          </View>

          {/* Generate Button */}
          {refImage && refImageDescription && !isAnalyzingRef && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateImages}
            >
              <Text style={styles.generateButtonText}>Generate Preview ✨</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // GENERATING SCREEN
  if (screen === "generating") {
    // Calculate perceived time (60 seconds total)
    const perceivedMinutes = Math.floor(
      (60 * (100 - generationProgress)) / 100 / 60
    );
    const perceivedSeconds =
      Math.floor((60 * (100 - generationProgress)) / 100) % 60;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.generatingContent}>
          {/* Animated Icon */}
          <View style={styles.generatingIconContainer}>
            <Text style={styles.generatingIcon}>✨</Text>
          </View>

          <Text style={styles.generatingTitle}>Creating Your Look</Text>
          <Text style={styles.generatingSubtitle}>{generationStep}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${generationProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{generationProgress}%</Text>
          </View>

          {/* Time Estimate */}
          <View style={styles.timeEstimate}>
            <Text style={styles.timeEstimateLabel}>
              Estimated time remaining
            </Text>
            <Text style={styles.timeEstimateValue}>
              ~{perceivedSeconds > 0 ? `${perceivedSeconds}s` : "Almost done!"}
            </Text>
          </View>

          {/* Fun Facts */}
          <View style={styles.funFactBox}>
            <Text style={styles.funFactIcon}>💡</Text>
            <Text style={styles.funFactText}>
              {generationProgress < 30
                ? "Analyzing your unique hair characteristics..."
                : generationProgress < 60
                ? "AI is learning your facial features..."
                : generationProgress < 90
                ? "Crafting the perfect hairstyle for you..."
                : "Putting on the finishing touches..."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // RESULT SCREEN - Vertical comparison, maximized
  if (screen === "result") {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <StatusBar style="light" />

        {/* Minimal Header */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Your New Look</Text>
        </View>

        {/* Comparison - Vertical Layout */}
        <View style={styles.comparisonContainer}>
          {/* Original Photo - Top */}
          <View style={styles.comparisonImageWrapper}>
            <Text style={styles.comparisonLabel}>BEFORE</Text>
            {userPhoto && (
              <Image
                source={{ uri: userPhoto.uri }}
                style={styles.comparisonImageFull}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Divider */}
          <View style={styles.comparisonDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerIcon}>↓</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Generated Photo - Bottom */}
          <View style={styles.comparisonImageWrapper}>
            <Text style={styles.comparisonLabel}>AFTER</Text>
            {generatedImage && (
              <Image
                source={{ uri: generatedImage }}
                style={styles.comparisonImageFull}
                resizeMode="cover"
              />
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.resultActionBtn}
            onPress={() => {
              setSelectedStyle("");
              setGeneratedImage(null);
              setScreen(flowType === "style" ? "styleSelect" : "refUpload");
            }}
          >
            <Text style={styles.resultActionText}>Try Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resultActionBtn, styles.resultActionBtnPrimary]}
            onPress={resetApp}
          >
            <Text style={styles.resultActionTextPrimary}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },

  // Initial Screen
  initialContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  logoSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  selectionSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a24",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 8,
  },
  genderPillActive: {
    borderColor: "#7c5cff",
    backgroundColor: "#1f1a30",
  },
  genderEmoji: {
    fontSize: 24,
  },
  genderText: {
    fontSize: 16,
    color: "#888",
    fontWeight: "600",
  },
  genderTextActive: {
    color: "#fff",
  },
  flowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a24",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  flowCardActive: {
    borderColor: "#7c5cff",
    backgroundColor: "#1f1a30",
  },
  flowCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#252530",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  flowEmoji: {
    fontSize: 24,
  },
  flowCardContent: {
    flex: 1,
  },
  flowCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  flowCardDesc: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  flowCardCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7c5cff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  primaryButton: {
    backgroundColor: "#7c5cff",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Photo Capture Screen
  photoCaptureContent: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: "#7c5cff",
    fontSize: 16,
    fontWeight: "600",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 32,
    lineHeight: 22,
  },
  photoOptions: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  photoOptionCard: {
    flex: 1,
    backgroundColor: "#1a1a24",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  photoOptionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  photoOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  photoOptionDesc: {
    fontSize: 12,
    color: "#666",
  },
  tipsBox: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: "#888",
    marginBottom: 6,
    lineHeight: 20,
  },
  demoButton: {
    backgroundColor: "rgba(124, 92, 255, 0.2)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  demoButtonText: {
    color: "#7c5cff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Photo Confirm Screen
  photoConfirmContent: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
  },
  photoConfirmPreview: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a1a24",
    marginVertical: 20,
  },
  photoConfirmImage: {
    width: "100%",
    height: "100%",
  },
  photoConfirmActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: "#1a1a24",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  retakeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmPhotoButton: {
    flex: 1,
    backgroundColor: "#00b894",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmPhotoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  faceGuide: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH * 0.35,
    borderWidth: 3,
    borderColor: "rgba(124, 92, 255, 0.6)",
    borderStyle: "dashed",
  },
  cameraHint: {
    color: "#fff",
    fontSize: 16,
    marginTop: 24,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraControls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  cameraBackBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBackText: {
    color: "#fff",
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#7c5cff",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#7c5cff",
  },
  cameraPlaceholder: {
    width: 50,
  },

  // Style Select Screen
  styleSelectContainer: {
    flex: 1,
  },
  styleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
  },
  screenTitleSmall: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 16,
  },
  colorPickerSection: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  colorPickerLabel: {
    fontSize: 13,
    color: "#888",
    marginLeft: 16,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colorPickerList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  colorChip: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#1a1a24",
    minWidth: 70,
  },
  colorChipActive: {
    backgroundColor: "#2d2a40",
    borderWidth: 2,
    borderColor: "#7c5cff",
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "#333",
  },
  colorDotNatural: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#252530",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  colorDotNaturalText: {
    fontSize: 16,
  },
  colorChipText: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
  },
  colorChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a24",
    paddingBottom: 12,
  },
  filterList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#1a1a24",
  },
  filterChipActive: {
    backgroundColor: "#7c5cff",
  },
  filterChipText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  stylesScrollView: {
    flex: 1,
  },
  stylesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  styleCard: {
    width: (SCREEN_WIDTH - 48) / 3,
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleCardActive: {
    borderColor: "#7c5cff",
    backgroundColor: "#1f1a30",
  },
  stylePreviewPlaceholder: {
    width: "100%",
    aspectRatio: 0.85,
    backgroundColor: "#252530",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stylePreviewIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  styleCardText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 16,
  },
  styleCardTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  styleCardCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7c5cff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMarkSmall: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  generateButton: {
    backgroundColor: "#7c5cff",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Reference Upload Screen
  refUploadContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
  },
  refImageSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  refPreviewContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  refPreviewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
  },
  refRemoveBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  refRemoveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  refAnalyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  refAnalyzingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  refDescriptionBox: {
    backgroundColor: "#1a1a24",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  refDescriptionLabel: {
    fontSize: 12,
    color: "#7c5cff",
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refDescriptionText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 22,
  },
  refUploadCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#252530",
    borderStyle: "dashed",
  },
  refUploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  refUploadText: {
    fontSize: 16,
    color: "#888",
  },
  orDivider: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    marginVertical: 20,
  },
  urlInput: {
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#252530",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.3)",
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffc107",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#bbb",
    lineHeight: 20,
  },

  // Generating Screen
  generatingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  generatingIconContainer: {
    marginBottom: 24,
  },
  generatingIcon: {
    fontSize: 72,
  },
  generatingTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 40,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#1a1a24",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7c5cff",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: "#7c5cff",
    fontWeight: "700",
    textAlign: "center",
  },
  timeEstimate: {
    alignItems: "center",
    marginBottom: 40,
  },
  timeEstimateLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  timeEstimateValue: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  funFactBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 16,
    width: "100%",
  },
  funFactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  funFactText: {
    flex: 1,
    fontSize: 14,
    color: "#888",
    lineHeight: 20,
  },

  // Result Screen
  resultContainer: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  resultHeader: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a24",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  comparisonContainer: {
    flex: 1,
    padding: 16,
  },
  comparisonImageWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a24",
  },
  comparisonLabel: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    overflow: "hidden",
  },
  comparisonImageFull: {
    width: "100%",
    height: "100%",
  },
  comparisonDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#252530",
  },
  dividerIcon: {
    fontSize: 20,
    color: "#7c5cff",
    marginHorizontal: 12,
  },
  resultActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  resultActionBtn: {
    flex: 1,
    backgroundColor: "#1a1a24",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#252530",
  },
  resultActionBtnPrimary: {
    backgroundColor: "#7c5cff",
    borderColor: "#7c5cff",
  },
  resultActionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  resultActionTextPrimary: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },

  // Common
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permissionText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
});
