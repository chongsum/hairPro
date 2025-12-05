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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
// Asset import removed - using Image.resolveAssetSource instead
import { CameraView, useCameraPermissions } from "expo-camera";
import { generateHairstyle } from "./src/services/falai";
import {
  analyzeHair,
  assessFeasibility,
  HairAnalysis,
  FeasibilityAssessment,
} from "./src/services/openrouter";

// Demo image for development
const DEMO_FRONT_IMAGE = require("./assets/demo_front.jpg");

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Screen types for navigation
type Screen =
  | "welcome"
  | "photoMethod"
  | "cameraCapture"
  | "uploadGuide"
  | "photoConfirm"
  | "analyzing"
  | "analysisResult"
  | "gender"
  | "styleSelect"
  | "lengthSelect"
  | "colorSelect"
  | "feasibility"
  | "generating"
  | "result";

type Gender = "male" | "female";

// Hair length options
const HAIR_LENGTHS = [
  { id: "buzz", label: "Buzz Cut", description: "< 1 inch" },
  { id: "short", label: "Short", description: "1-3 inches" },
  { id: "medium", label: "Medium", description: "3-6 inches" },
  {
    id: "shoulderLength",
    label: "Shoulder Length",
    description: "6-12 inches",
  },
  { id: "long", label: "Long", description: "12-18 inches" },
  { id: "veryLong", label: "Very Long", description: "18+ inches" },
];

// Hairstyle presets
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
    shoulderLength: [
      "Flow Hairstyle",
      "Surfer Hair",
      "Layered Shag",
      "Bro Flow",
    ],
    long: ["Man Bun", "Long Layers", "Samurai Top Knot", "Viking Style"],
    veryLong: ["Classic Long", "Long with Layers", "Bohemian Waves"],
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
    shoulderLength: [
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
      "Curtain Bangs Long",
    ],
    veryLong: [
      "Classic Long Layers",
      "Mermaid Waves",
      "Bohemian Long",
      "Sleek Straight",
      "Rapunzel Layers",
    ],
  },
};

// Natural hair colors only (no fantasy colors)
const HAIR_COLORS = [
  { id: "natural", name: "Keep Natural", color: null },
  { id: "jetBlack", name: "Jet Black", color: "#0a0a0a" },
  { id: "naturalBlack", name: "Natural Black", color: "#1a1a1a" },
  { id: "darkBrown", name: "Dark Brown", color: "#3d2314" },
  { id: "chocolateBrown", name: "Chocolate", color: "#4a3728" },
  { id: "chestnut", name: "Chestnut", color: "#954535" },
  { id: "auburn", name: "Auburn", color: "#922724" },
  { id: "mediumBrown", name: "Medium Brown", color: "#6b4423" },
  { id: "lightBrown", name: "Light Brown", color: "#8b5a2b" },
  { id: "caramel", name: "Caramel", color: "#a67b5b" },
  { id: "honeyBlonde", name: "Honey Blonde", color: "#c9a86c" },
  { id: "goldenBlonde", name: "Golden Blonde", color: "#d4a574" },
  { id: "ashBlonde", name: "Ash Blonde", color: "#c2b280" },
  { id: "platinumBlonde", name: "Platinum", color: "#e8e4c9" },
  { id: "strawberryBlonde", name: "Strawberry", color: "#cc7a5f" },
  { id: "ginger", name: "Ginger", color: "#b55239" },
  { id: "copper", name: "Copper", color: "#b87333" },
  { id: "silver", name: "Silver/Gray", color: "#a8a8a8" },
];

// SVG-style icon components using View/Text
const FrontFaceIcon = () => (
  <View style={iconStyles.faceContainer}>
    <View style={iconStyles.faceOutline}>
      <Text style={iconStyles.faceEmoji}>👤</Text>
    </View>
    <View style={iconStyles.arrowDown}>
      <Text style={iconStyles.arrowText}>↓</Text>
    </View>
  </View>
);

const SideFaceIcon = () => (
  <View style={iconStyles.sideIconContainer}>
    <View style={iconStyles.faceOutline}>
      <Text style={iconStyles.faceEmoji}>👤</Text>
    </View>
    <View style={iconStyles.angleIndicator}>
      <Text style={iconStyles.angleText}>45°</Text>
    </View>
  </View>
);

const CameraIcon = () => <Text style={{ fontSize: 48 }}>📷</Text>;

const GalleryIcon = () => <Text style={{ fontSize: 48 }}>🖼️</Text>;

const CheckIcon = () => <Text style={{ fontSize: 24 }}>✓</Text>;

// Face overlay guide component for camera
const FaceOverlayGuide = ({ step }: { step: "front" | "side" }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={overlayStyles.container}>
      {/* Darkened corners */}
      <View style={overlayStyles.darkOverlay}>
        <Animated.View
          style={[
            overlayStyles.faceGuide,
            step === "side" && overlayStyles.faceGuideSide,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {/* Face oval guide */}
          <View style={overlayStyles.faceOval}>
            {step === "front" ? (
              <>
                <View style={overlayStyles.eyeLine} />
                <View style={overlayStyles.noseLine} />
                <View style={overlayStyles.centerLine} />
              </>
            ) : (
              <>
                <View style={overlayStyles.sideProfile} />
                <View style={[overlayStyles.angleArrow, { left: -60 }]}>
                  <Text style={overlayStyles.angleText}>45°</Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Instructions */}
      <View style={overlayStyles.instructionBox}>
        <Text style={overlayStyles.instructionTitle}>
          {step === "front" ? "📸 Front View" : "📸 45° Side View"}
        </Text>
        <Text style={overlayStyles.instructionText}>
          {step === "front"
            ? "Position your face within the oval guide.\nLook directly at the camera."
            : "Turn your head slightly to show your profile.\nKeep your hairline visible."}
        </Text>
      </View>
    </View>
  );
};

// Score bar component
const ScoreBar = ({
  label,
  score,
  maxScore = 100,
  color = "#6c5ce7",
}: {
  label: string;
  score: number;
  maxScore?: number;
  color?: string;
}) => {
  const percentage = (score / maxScore) * 100;
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: percentage,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={scoreStyles.container}>
      <View style={scoreStyles.labelRow}>
        <Text style={scoreStyles.label}>{label}</Text>
        <Text style={scoreStyles.value}>
          {score}/{maxScore}
        </Text>
      </View>
      <View style={scoreStyles.barBackground}>
        <Animated.View
          style={[
            scoreStyles.barFill,
            {
              backgroundColor: color,
              width: animWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

// Main App Component
export default function App() {
  // Navigation state
  const [screen, setScreen] = useState<Screen>("welcome");

  // Image state (single front-facing photo)
  const [frontImage, setFrontImage] = useState<{
    uri: string;
    base64: string;
  } | null>(null);

  // Analysis states
  const [gender, setGender] = useState<Gender>("female");
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Style selection states
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [customStyleUrl, setCustomStyleUrl] = useState<string>("");
  const [selectedLength, setSelectedLength] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("natural");

  // Feasibility states
  const [feasibility, setFeasibility] = useState<FeasibilityAssessment | null>(
    null
  );
  const [isAssessing, setIsAssessing] = useState(false);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Camera refs
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [screen]);

  // Start hair analysis in BACKGROUND - user can continue selecting options
  const startHairAnalysisBackground = useCallback(async () => {
    if (!frontImage?.base64) return;
    if (isAnalyzing || hairAnalysis) return; // Already running or completed

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Using front image only for analysis
      const analysis = await analyzeHair(
        frontImage.base64,
        frontImage.base64, // Pass same image for compatibility
        gender
      );
      setHairAnalysis(analysis);
    } catch (error: any) {
      setAnalysisError(error.message || "Failed to analyze hair");
      console.error("Background hair analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [frontImage, gender, isAnalyzing, hairAnalysis]);

  // Start analysis automatically when photo is confirmed
  useEffect(() => {
    if (screen === "gender" && frontImage && !hairAnalysis && !isAnalyzing) {
      startHairAnalysisBackground();
    }
  }, [
    screen,
    frontImage,
    hairAnalysis,
    isAnalyzing,
    startHairAnalysisBackground,
  ]);

  // Run feasibility assessment
  const runFeasibilityAssessment = useCallback(async () => {
    if (!hairAnalysis) {
      Alert.alert("Please wait", "Hair analysis is still in progress.");
      return;
    }

    setIsAssessing(true);
    setScreen("feasibility");

    try {
      const colorName =
        HAIR_COLORS.find((c) => c.id === selectedColor)?.name || "Natural";
      const assessment = await assessFeasibility(
        hairAnalysis,
        selectedStyle || "Natural style",
        selectedLength,
        colorName,
        gender
      );
      setFeasibility(assessment);
    } catch (error: any) {
      Alert.alert(
        "Assessment Error",
        "Could not complete feasibility assessment. Please try again."
      );
    } finally {
      setIsAssessing(false);
    }
  }, [hairAnalysis, selectedStyle, selectedLength, selectedColor, gender]);

  // Generate hairstyle images
  const generateImages = useCallback(async () => {
    if (!frontImage?.base64) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setScreen("generating");

    // Build enhanced prompt with analysis and feasibility data
    const colorName =
      HAIR_COLORS.find((c) => c.id === selectedColor)?.name || "";
    const lengthLabel =
      HAIR_LENGTHS.find((l) => l.id === selectedLength)?.label ||
      selectedLength;

    // Build comprehensive style description using analysis data
    let styleDescription = `${selectedStyle} hairstyle, ${lengthLabel} length`;

    if (colorName && colorName !== "Keep Natural") {
      styleDescription += `, ${colorName} hair color`;
    }

    // Add hair analysis context for more realistic generation
    if (hairAnalysis) {
      styleDescription += `. Current hair: ${hairAnalysis.hairTexture.value} texture, ${hairAnalysis.hairDensity.value} density`;
      if (hairAnalysis.faceShape.value) {
        styleDescription += `, ${hairAnalysis.faceShape.value} face shape`;
      }
    }

    // Add feasibility guidance for realistic results
    if (feasibility) {
      if (feasibility.textureCompatibility.stylingRequired) {
        styleDescription += `. Style with ${feasibility.textureCompatibility.stylingRequired}`;
      }
      if (feasibility.professionalNotes) {
        styleDescription += `. ${feasibility.professionalNotes}`;
      }
    }

    console.log("Enhanced generation prompt:", styleDescription);

    try {
      // Generate single image from front photo
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 3, 90));
      }, 400);

      setGenerationProgress(10);

      const result = await generateHairstyle(
        frontImage.base64,
        styleDescription,
        gender
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGeneratedImages([result]);
      setScreen("result");
    } catch (error: any) {
      Alert.alert(
        "Generation Error",
        error.message || "Failed to generate hairstyle images"
      );
      setScreen("feasibility");
    } finally {
      setIsGenerating(false);
    }
  }, [
    frontImage,
    selectedStyle,
    selectedLength,
    selectedColor,
    gender,
    hairAnalysis,
    feasibility,
  ]);

  // Camera capture function
  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (photo) {
        setFrontImage({
          uri: photo.uri,
          base64: photo.base64 || "",
        });
        setScreen("photoConfirm");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData = {
          uri: asset.uri,
          base64: asset.base64 || "",
        };

        if (!imageData.base64) {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: "base64",
          });
          imageData.base64 = base64;
        }

        setFrontImage(imageData);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick image");
    }
  };

  // Reset app state
  const resetApp = () => {
    setScreen("welcome");
    setFrontImage(null);
    setHairAnalysis(null);
    setFeasibility(null);
    setSelectedStyle("");
    setSelectedLength("");
    setSelectedColor("natural");
    setGeneratedImages([]);
    setGenerationProgress(0);
  };

  // Use demo photo for development/testing
  const useDemoPhotos = async () => {
    try {
      // Helper function to load asset and convert to base64
      const loadAssetAsBase64 = async (
        assetModule: any
      ): Promise<{ uri: string; base64: string }> => {
        // Get the URI from resolveAssetSource
        const resolved = Image.resolveAssetSource(assetModule);
        const uri = resolved.uri;

        // Fetch the image and convert to base64
        const response = await fetch(uri);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1];
            resolve({ uri, base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      // Load demo front image only
      const frontData = await loadAssetAsBase64(DEMO_FRONT_IMAGE);
      setFrontImage(frontData);
      setScreen("photoConfirm");
    } catch (error) {
      console.error("Error loading demo photos:", error);
      Alert.alert(
        "Error",
        "Failed to load demo photos. Please try uploading manually."
      );
    }
  };

  // ============ SCREENS ============

  // WELCOME SCREEN
  if (screen === "welcome") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeLogo}>✂️</Text>
          <Text style={styles.welcomeTitle}>HairPro</Text>
          <Text style={styles.welcomeSubtitle}>
            Professional Hairstyle Visualization
          </Text>

          <View style={styles.welcomeFeatures}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureText}>AI-Powered Analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Realistic Preview</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>Feasibility Check</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setScreen("photoMethod")}
          >
            <Text style={styles.startButtonText}>Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.welcomeNote}>
            Help your clients visualize their new look before committing
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // PHOTO METHOD SELECTION
  if (screen === "photoMethod") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={resetApp}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Capture Client Photo</Text>
          <Text style={styles.screenSubtitle}>
            Take a front-facing photo of the client
          </Text>

          <View style={styles.methodCards}>
            {/* Camera Option */}
            <TouchableOpacity
              style={styles.methodCard}
              onPress={async () => {
                if (!permission?.granted) {
                  const result = await requestPermission();
                  if (!result.granted) {
                    Alert.alert(
                      "Camera Access Required",
                      "Please enable camera access to take photos"
                    );
                    return;
                  }
                }
                setScreen("cameraCapture");
              }}
            >
              <CameraIcon />
              <Text style={styles.methodTitle}>Take Photos</Text>
              <Text style={styles.methodDesc}>
                Use guided overlay for perfect positioning
              </Text>
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>Recommended</Text>
              </View>
            </TouchableOpacity>

            {/* Upload Option */}
            <TouchableOpacity
              style={[styles.methodCard, styles.methodCardSecondary]}
              onPress={() => setScreen("uploadGuide")}
            >
              <GalleryIcon />
              <Text style={styles.methodTitle}>Upload Photos</Text>
              <Text style={styles.methodDesc}>
                Select existing photos from gallery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Photo Requirements */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>📋 Photo Requirements</Text>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>💡</Text>
              <Text style={styles.requirementText}>Good, even lighting</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>👤</Text>
              <Text style={styles.requirementText}>
                Face & hairline clearly visible
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>🎯</Text>
              <Text style={styles.requirementText}>Neutral background</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>📐</Text>
              <Text style={styles.requirementText}>
                Natural head position, no accessories
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // CAMERA CAPTURE SCREEN
  if (screen === "cameraCapture") {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.centerContent}>
            <Text style={styles.permissionText}>
              Camera permission is required
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestPermission}
            >
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <FaceOverlayGuide step={"front"} />

          {/* Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraBackButton}
              onPress={() => setScreen("photoMethod")}
            >
              <Text style={styles.cameraBackText}>←</Text>
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

  // UPLOAD GUIDE SCREEN
  if (screen === "uploadGuide") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen("photoMethod")}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Upload Photo</Text>
          <Text style={styles.screenSubtitle}>
            Select a front-facing photo from your gallery
          </Text>

          {/* Photo Guide Card */}
          <View style={styles.uploadGuideCards}>
            <View style={styles.uploadGuideCard}>
              <View style={styles.uploadGuideCardContent}>
                <FrontFaceIcon />
              </View>
              <Text style={styles.uploadGuideTitle}>Front View Photo</Text>
              <Text style={styles.uploadGuideDesc}>
                • Face camera directly{"\n"}• Eyes level with camera{"\n"}• Full
                forehead visible{"\n"}• Good lighting
              </Text>
              <View style={styles.uploadGuideCardContent}>
                {frontImage ? (
                  <View style={styles.uploadPreviewContainer}>
                    <Image
                      source={{ uri: frontImage.uri }}
                      style={styles.uploadPreview}
                    />
                    <TouchableOpacity
                      style={styles.changePhotoButton}
                      onPress={pickImage}
                    >
                      <Text style={styles.changePhotoText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.uploadButtonText}>Select Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Continue Button */}
          {frontImage && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setScreen("photoConfirm")}
            >
              <Text style={styles.continueButtonText}>Continue →</Text>
            </TouchableOpacity>
          )}

          {/* Demo Button - Development Only */}
          <TouchableOpacity style={styles.demoButton} onPress={useDemoPhotos}>
            <Text style={styles.demoButtonText}>🧪 Use Demo Photos (Dev)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PHOTO CONFIRMATION SCREEN
  if (screen === "photoConfirm") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen("photoMethod")}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Confirm Photo</Text>
          <Text style={styles.screenSubtitle}>
            Review your photo before continuing
          </Text>

          {/* Single Photo Display */}
          <View style={styles.confirmPhotoContainer}>
            <Text style={styles.confirmPhotoLabel}>📸 Front View</Text>
            {frontImage && (
              <Image
                source={{ uri: frontImage.uri }}
                style={styles.confirmPhotoLarge}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setFrontImage(null);
                setScreen("photoMethod");
              }}
            >
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setScreen("gender")}
            >
              <Text style={styles.confirmButtonText}>Photos Look Good ✓</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // GENDER SELECTION SCREEN
  if (screen === "gender") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centerContent}>
          <Text style={styles.screenTitle}>Client Gender</Text>
          <Text style={styles.screenSubtitle}>
            This helps us provide better style recommendations
          </Text>

          <View style={styles.genderOptions}>
            <TouchableOpacity
              style={[
                styles.genderCard,
                gender === "female" && styles.genderCardActive,
              ]}
              onPress={() => setGender("female")}
            >
              <Text style={styles.genderEmoji}>👩</Text>
              <Text style={styles.genderLabel}>Female</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderCard,
                gender === "male" && styles.genderCardActive,
              ]}
              onPress={() => setGender("male")}
            >
              <Text style={styles.genderEmoji}>👨</Text>
              <Text style={styles.genderLabel}>Male</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              // Go to length selection first - analysis runs in background
              setScreen("lengthSelect");
            }}
          >
            <Text style={styles.continueButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ANALYZING SCREEN
  if (screen === "analyzing") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.analyzingTitle}>Analyzing Hair...</Text>
          <Text style={styles.analyzingSubtitle}>
            Our AI is examining your client's hair characteristics
          </Text>

          <View style={styles.analyzingSteps}>
            <Text style={styles.analyzingStep}>📐 Measuring hair length</Text>
            <Text style={styles.analyzingStep}>
              🌀 Detecting texture pattern
            </Text>
            <Text style={styles.analyzingStep}>🎨 Analyzing hair color</Text>
            <Text style={styles.analyzingStep}>📊 Assessing density</Text>
            <Text style={styles.analyzingStep}>✨ Evaluating condition</Text>
          </View>

          <Text style={styles.analyzingNote}>
            This may take 10-20 seconds...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ANALYSIS RESULT SCREEN (Hair Dashboard)
  if (screen === "analysisResult") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.screenTitle}>Hair Analysis Complete</Text>

          {hairAnalysis && (
            <>
              {/* Overall Score Card */}
              <View style={styles.overallScoreCard}>
                <Text style={styles.overallScoreLabel}>Overall Hair Score</Text>
                <Text style={styles.overallScoreValue}>
                  {hairAnalysis.overallScore}
                </Text>
                <Text style={styles.overallScoreMax}>/100</Text>
                <Text style={styles.stylingPotential}>
                  Styling Potential: {hairAnalysis.stylingPotential}
                </Text>
              </View>

              {/* Hair Properties */}
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Hair Properties</Text>

                <View style={styles.propertyRow}>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Texture</Text>
                    <Text style={styles.propertyValue}>
                      {hairAnalysis.hairTexture.value}
                    </Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Density</Text>
                    <Text style={styles.propertyValue}>
                      {hairAnalysis.hairDensity.value}
                    </Text>
                  </View>
                </View>

                <View style={styles.propertyRow}>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Length</Text>
                    <Text style={styles.propertyValue}>
                      {hairAnalysis.hairLength.value}
                    </Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Color</Text>
                    <Text style={styles.propertyValue}>
                      {hairAnalysis.hairColor.value}
                    </Text>
                  </View>
                </View>

                <View style={styles.propertyRow}>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Face Shape</Text>
                    <Text style={styles.propertyValue}>
                      {hairAnalysis.faceShape.value}
                    </Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Condition</Text>
                    <Text style={styles.propertyValue}>
                      {hairAnalysis.hairCondition.value}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => setScreen("lengthSelect")}
          >
            <Text style={styles.continueButtonText}>
              Choose Target Length →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STYLE SELECTION SCREEN (Now shows styles based on selected length)
  if (screen === "styleSelect") {
    // Get hairstyles for the selected length
    const availableStyles = selectedLength
      ? HAIRSTYLES_BY_LENGTH[gender][
          selectedLength as keyof typeof HAIRSTYLES_BY_LENGTH.male
        ] || []
      : [];
    const lengthLabel =
      HAIR_LENGTHS.find((l) => l.id === selectedLength)?.label || "";

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen("lengthSelect")}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Choose Hairstyle</Text>
          <Text style={styles.screenSubtitle}>
            Styles for {lengthLabel} hair
          </Text>

          {/* Background Analysis Status */}
          {isAnalyzing && (
            <View style={styles.analysisStatusBanner}>
              <ActivityIndicator size="small" color="#6c5ce7" />
              <Text style={styles.analysisStatusText}>
                Analyzing hair in background...
              </Text>
            </View>
          )}
          {hairAnalysis && !isAnalyzing && (
            <TouchableOpacity
              style={styles.analysisCompleteBanner}
              onPress={() => setScreen("analysisResult")}
            >
              <Text style={styles.analysisCompleteText}>
                ✓ Analysis complete • Tap to view
              </Text>
            </TouchableOpacity>
          )}

          {/* Styles for selected length */}
          <Text style={styles.sectionLabel}>Recommended Styles</Text>
          <View style={styles.styleGrid}>
            {availableStyles.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.styleChip,
                  selectedStyle === style && styles.styleChipActive,
                ]}
                onPress={() => {
                  setSelectedStyle(style);
                  setCustomStyleUrl("");
                }}
              >
                <Text
                  style={[
                    styles.styleChipText,
                    selectedStyle === style && styles.styleChipTextActive,
                  ]}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Reference URL */}
          <Text style={styles.sectionLabel}>Or Paste Reference Image URL</Text>
          <TextInput
            style={styles.urlInput}
            placeholder="https://example.com/hairstyle.jpg"
            placeholderTextColor="#666"
            value={customStyleUrl}
            onChangeText={(text) => {
              setCustomStyleUrl(text);
              if (text) setSelectedStyle("");
            }}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* Upload Reference */}
          <TouchableOpacity
            style={styles.uploadRefButton}
            onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setCustomStyleUrl(result.assets[0].uri);
                setSelectedStyle("Custom Reference");
              }
            }}
          >
            <Text style={styles.uploadRefButtonText}>
              📷 Upload Reference Photo
            </Text>
          </TouchableOpacity>

          {(selectedStyle || customStyleUrl) && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setScreen("colorSelect")}
            >
              <Text style={styles.continueButtonText}>Choose Color →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // LENGTH SELECTION SCREEN (Now first step after gender)
  if (screen === "lengthSelect") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen("gender")}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Target Hair Length</Text>
          <Text style={styles.screenSubtitle}>
            Select the desired length for the new style
          </Text>

          {/* Background Analysis Status */}
          {isAnalyzing && (
            <View style={styles.analysisStatusBanner}>
              <ActivityIndicator size="small" color="#6c5ce7" />
              <Text style={styles.analysisStatusText}>
                Analyzing hair in background...
              </Text>
            </View>
          )}
          {hairAnalysis && !isAnalyzing && (
            <TouchableOpacity
              style={styles.analysisCompleteBanner}
              onPress={() => setScreen("analysisResult")}
            >
              <Text style={styles.analysisCompleteText}>
                ✓ Analysis complete • Tap to view
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.lengthOptions}>
            {HAIR_LENGTHS.map((length) => (
              <TouchableOpacity
                key={length.id}
                style={[
                  styles.lengthOption,
                  selectedLength === length.id && styles.lengthOptionActive,
                ]}
                onPress={() => setSelectedLength(length.id)}
              >
                <Text
                  style={[
                    styles.lengthLabel,
                    selectedLength === length.id && styles.lengthLabelActive,
                  ]}
                >
                  {length.label}
                </Text>
                <Text style={styles.lengthDesc}>{length.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedLength && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setScreen("styleSelect")}
            >
              <Text style={styles.continueButtonText}>Choose Hairstyle →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // COLOR SELECTION SCREEN
  if (screen === "colorSelect") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen("styleSelect")}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Hair Color</Text>
          <Text style={styles.screenSubtitle}>
            Select target hair color or keep natural
          </Text>

          {/* Background Analysis Status */}
          {isAnalyzing && (
            <View style={styles.analysisStatusBanner}>
              <ActivityIndicator size="small" color="#6c5ce7" />
              <Text style={styles.analysisStatusText}>
                Analyzing hair in background...
              </Text>
            </View>
          )}
          {hairAnalysis && !isAnalyzing && (
            <TouchableOpacity
              style={styles.analysisCompleteBanner}
              onPress={() => setScreen("analysisResult")}
            >
              <Text style={styles.analysisCompleteText}>
                ✓ Analysis complete • Tap to view
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.colorGrid}>
            {HAIR_COLORS.map((colorOption) => (
              <TouchableOpacity
                key={colorOption.id}
                style={[
                  styles.colorOption,
                  selectedColor === colorOption.id && styles.colorOptionActive,
                ]}
                onPress={() => setSelectedColor(colorOption.id)}
              >
                {colorOption.color ? (
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: colorOption.color },
                    ]}
                  />
                ) : (
                  <View style={styles.naturalSwatch}>
                    <Text style={styles.naturalSwatchText}>🎨</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.colorName,
                    selectedColor === colorOption.id && styles.colorNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {colorOption.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={runFeasibilityAssessment}
          >
            <Text style={styles.continueButtonText}>Check Feasibility →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // FEASIBILITY ASSESSMENT SCREEN
  if (screen === "feasibility") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen("colorSelect")}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Feasibility Assessment</Text>

          {/* Show if hair analysis is still running */}
          {isAnalyzing && (
            <View style={styles.analysisStatusBanner}>
              <ActivityIndicator size="small" color="#6c5ce7" />
              <Text style={styles.analysisStatusText}>
                Hair analysis in progress... Please wait
              </Text>
            </View>
          )}

          {isAssessing ? (
            <View style={styles.assessingContainer}>
              <ActivityIndicator size="large" color="#6c5ce7" />
              <Text style={styles.assessingText}>Analyzing feasibility...</Text>
              <Text style={styles.assessingSubtext}>
                Comparing current hair with target style
              </Text>
            </View>
          ) : !hairAnalysis && !isAnalyzing ? (
            <View style={styles.assessingContainer}>
              <Text style={styles.assessingText}>⚠️ Analysis Required</Text>
              <Text style={styles.assessingSubtext}>
                Hair analysis failed or not available.
              </Text>
              <TouchableOpacity
                style={[styles.continueButton, { marginTop: 20 }]}
                onPress={startHairAnalysisBackground}
              >
                <Text style={styles.continueButtonText}>Retry Analysis</Text>
              </TouchableOpacity>
            </View>
          ) : feasibility ? (
            <>
              {/* Overall Feasibility Score */}
              <View
                style={[
                  styles.feasibilityHeader,
                  feasibility.feasible
                    ? styles.feasibilityPass
                    : styles.feasibilityFail,
                ]}
              >
                <Text style={styles.feasibilityEmoji}>
                  {feasibility.feasible ? "✅" : "⚠️"}
                </Text>
                <Text style={styles.feasibilityStatus}>
                  {feasibility.feasible
                    ? "Style is Achievable!"
                    : "Modifications Needed"}
                </Text>
                <Text style={styles.feasibilityScore}>
                  {feasibility.overallScore}/100
                </Text>
              </View>

              {/* Compatibility Scores */}
              <View style={styles.compatibilitySection}>
                <Text style={styles.compatibilityTitle}>
                  Compatibility Analysis
                </Text>

                <ScoreBar
                  label="Length Match"
                  score={feasibility.lengthCompatibility.score}
                  color={
                    feasibility.lengthCompatibility.score >= 70
                      ? "#00b894"
                      : feasibility.lengthCompatibility.score >= 40
                      ? "#fdcb6e"
                      : "#e17055"
                  }
                />
                <Text style={styles.compatibilityDesc}>
                  {feasibility.lengthCompatibility.assessment}
                </Text>
                {feasibility.lengthCompatibility.timeToGrow && (
                  <Text style={styles.growthTime}>
                    ⏱️ Time to grow:{" "}
                    {feasibility.lengthCompatibility.timeToGrow}
                  </Text>
                )}

                <ScoreBar
                  label="Texture Match"
                  score={feasibility.textureCompatibility.score}
                  color={
                    feasibility.textureCompatibility.score >= 70
                      ? "#00b894"
                      : feasibility.textureCompatibility.score >= 40
                      ? "#fdcb6e"
                      : "#e17055"
                  }
                />
                <Text style={styles.compatibilityDesc}>
                  {feasibility.textureCompatibility.assessment}
                </Text>

                <ScoreBar
                  label="Density Match"
                  score={feasibility.densityCompatibility.score}
                  color={
                    feasibility.densityCompatibility.score >= 70
                      ? "#00b894"
                      : feasibility.densityCompatibility.score >= 40
                      ? "#fdcb6e"
                      : "#e17055"
                  }
                />
                <Text style={styles.compatibilityDesc}>
                  {feasibility.densityCompatibility.assessment}
                </Text>
              </View>

              {/* Salon Info */}
              <View style={styles.salonInfoSection}>
                <View style={styles.salonInfoItem}>
                  <Text style={styles.salonInfoLabel}>Estimated Time</Text>
                  <Text style={styles.salonInfoValue}>
                    {feasibility.estimatedSalonTime}
                  </Text>
                </View>
                <View style={styles.salonInfoItem}>
                  <Text style={styles.salonInfoLabel}>Maintenance</Text>
                  <Text style={styles.salonInfoValue}>
                    {feasibility.maintenanceLevel.value}
                  </Text>
                </View>
              </View>

              {/* Concerns */}
              {feasibility.concerns.length > 0 && (
                <View style={styles.concernsSection}>
                  <Text style={styles.concernsTitle}>⚠️ Considerations</Text>
                  {feasibility.concerns.map((concern, i) => (
                    <Text key={i} style={styles.concernItem}>
                      • {concern}
                    </Text>
                  ))}
                </View>
              )}

              {/* Suggestions */}
              {feasibility.suggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
                  {feasibility.suggestions.map((suggestion, i) => (
                    <Text key={i} style={styles.suggestionItem}>
                      • {suggestion}
                    </Text>
                  ))}
                </View>
              )}

              {/* Professional Notes */}
              {feasibility.professionalNotes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>📝 Stylist Notes</Text>
                  <Text style={styles.notesText}>
                    {feasibility.professionalNotes}
                  </Text>
                </View>
              )}

              {/* Generate Button */}
              {feasibility.feasible && (
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateImages}
                >
                  <Text style={styles.generateButtonText}>
                    ✨ Generate Preview
                  </Text>
                  <Text style={styles.generateButtonNote}>
                    This takes about 1 minute
                  </Text>
                </TouchableOpacity>
              )}

              {!feasibility.feasible && (
                <View style={styles.notFeasibleActions}>
                  <TouchableOpacity
                    style={styles.modifyStyleButton}
                    onPress={() => setScreen("styleSelect")}
                  >
                    <Text style={styles.modifyStyleText}>
                      Modify Style Selection
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.generateButton, styles.generateAnywayButton]}
                    onPress={generateImages}
                  >
                    <Text style={styles.generateButtonText}>
                      Generate Anyway
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // GENERATING SCREEN
  if (screen === "generating") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centerContent}>
          <Text style={styles.generatingEmoji}>✨</Text>
          <Text style={styles.generatingTitle}>Creating Your Preview</Text>
          <Text style={styles.generatingSubtitle}>
            Our AI is generating your new hairstyle
          </Text>

          {/* Progress Bar */}
          <View style={styles.generatingProgressContainer}>
            <View style={styles.generatingProgressBar}>
              <View
                style={[
                  styles.generatingProgressFill,
                  { width: `${generationProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.generatingProgressText}>
              {generationProgress}%
            </Text>
          </View>

          <View style={styles.generatingSteps}>
            <Text
              style={[
                styles.generatingStep,
                generationProgress >= 20 && styles.generatingStepActive,
                generationProgress >= 90 && styles.generatingStepDone,
              ]}
            >
              {generationProgress >= 90 ? "✓" : "⚡"} Generating your new
              hairstyle...
            </Text>
            <Text style={styles.generatingStepNote}>
              AI is creating your transformation
            </Text>
          </View>

          <View style={styles.patienceBox}>
            <Text style={styles.patienceEmoji}>⚡</Text>
            <Text style={styles.patienceTitle}>Almost there!</Text>
            <Text style={styles.patienceText}>
              Generating high-quality preview (~20-30 seconds).{"\n"}
              Quality results coming soon!
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // RESULT SCREEN - Before/After Comparison
  if (screen === "result") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultTitle}>Your New Look Preview</Text>
          <Text style={styles.resultSubtitle}>
            {selectedStyle || "Custom Style"} • {selectedLength} •{" "}
            {HAIR_COLORS.find((c) => c.id === selectedColor)?.name || "Natural"}
          </Text>

          {/* Before/After Comparison */}
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonRowTitle}>✨ Transformation</Text>
            <View style={styles.comparisonImages}>
              <View style={styles.comparisonImageBox}>
                <Text style={styles.comparisonImageLabel}>Before</Text>
                {frontImage && (
                  <Image
                    source={{ uri: frontImage.uri }}
                    style={styles.comparisonImage}
                    resizeMode="cover"
                  />
                )}
              </View>
              <View style={styles.comparisonArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              <View style={styles.comparisonImageBox}>
                <Text style={styles.comparisonImageLabel}>After</Text>
                {generatedImages[0] && (
                  <Image
                    source={{ uri: generatedImages[0] }}
                    style={styles.comparisonImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.tryAnotherButton}
              onPress={() => setScreen("styleSelect")}
            >
              <Text style={styles.tryAnotherText}>Try Another Style</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newClientButton} onPress={resetApp}>
              <Text style={styles.newClientText}>New Client</Text>
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            💡 These previews are AI-generated approximations.{"\n"}
            Actual results may vary based on individual hair characteristics.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// Icon styles
const iconStyles = StyleSheet.create({
  faceContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  sideIconContainer: {
    alignItems: "center",
    marginBottom: 10,
    width: 80,
  },
  faceOutline: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#6c5ce7",
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  faceEmoji: {
    fontSize: 32,
  },
  arrowDown: {
    marginTop: 5,
  },
  arrowText: {
    color: "#6c5ce7",
    fontSize: 20,
  },
  angleIndicator: {
    position: "absolute",
    bottom: -5,
    right: -20,
    backgroundColor: "#6c5ce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  angleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

// Overlay styles for camera
const overlayStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  faceGuide: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.85,
    justifyContent: "center",
    alignItems: "center",
  },
  faceGuideSide: {
    transform: [{ rotateY: "15deg" }],
  },
  faceOval: {
    width: "100%",
    height: "100%",
    borderWidth: 3,
    borderColor: "#6c5ce7",
    borderRadius: SCREEN_WIDTH * 0.35,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  eyeLine: {
    position: "absolute",
    top: "35%",
    left: "15%",
    right: "15%",
    height: 1,
    backgroundColor: "rgba(108, 92, 231, 0.5)",
  },
  noseLine: {
    position: "absolute",
    top: "50%",
    left: "45%",
    right: "45%",
    height: 1,
    backgroundColor: "rgba(108, 92, 231, 0.5)",
  },
  centerLine: {
    position: "absolute",
    top: "20%",
    bottom: "20%",
    left: "50%",
    width: 1,
    backgroundColor: "rgba(108, 92, 231, 0.3)",
  },
  sideProfile: {
    position: "absolute",
    top: "30%",
    left: "30%",
    width: "40%",
    height: "40%",
    borderLeftWidth: 2,
    borderColor: "rgba(108, 92, 231, 0.5)",
    borderTopLeftRadius: 50,
  },
  angleArrow: {
    position: "absolute",
    top: "50%",
    backgroundColor: "#6c5ce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  angleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  instructionBox: {
    position: "absolute",
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  instructionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  instructionText: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});

// Score bar styles
const scoreStyles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    textTransform: "capitalize",
  },
  value: {
    color: "#888",
    fontSize: 14,
  },
  barBackground: {
    height: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
});

// Main styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Welcome Screen
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeLogo: {
    fontSize: 80,
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 40,
  },
  welcomeFeatures: {
    width: "100%",
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    color: "#fff",
    fontSize: 16,
  },
  startButton: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 16,
    marginBottom: 20,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  welcomeNote: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },

  // Navigation
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: "#6c5ce7",
    fontSize: 16,
  },
  screenTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  screenSubtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 30,
  },

  // Photo Method Screen
  methodCards: {
    gap: 16,
    marginBottom: 30,
  },
  methodCard: {
    backgroundColor: "#6c5ce7",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  methodCardSecondary: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#333",
  },
  methodTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  methodDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
  },
  methodBadge: {
    backgroundColor: "#00b894",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  methodBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  requirementsBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
  },
  requirementsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  requirementIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  requirementText: {
    color: "#ccc",
    fontSize: 14,
  },

  // Camera Screen
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraProgress: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a2e",
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotActive: {
    borderColor: "#6c5ce7",
    backgroundColor: "#6c5ce7",
  },
  progressDotDone: {
    borderColor: "#00b894",
    backgroundColor: "#00b894",
  },
  progressNum: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: "#333",
    marginHorizontal: 8,
  },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cameraBackButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#6c5ce7",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6c5ce7",
  },
  cameraPlaceholder: {
    width: 50,
  },

  // Upload Screen
  uploadGuideCards: {
    gap: 20,
    marginBottom: 20,
  },
  uploadGuideCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
  },
  uploadGuideCardContent: {
    alignItems: "center",
  },
  uploadGuideTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  uploadGuideDesc: {
    color: "#888",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadPreviewContainer: {
    alignItems: "center",
  },
  uploadPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },
  changePhotoButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  changePhotoText: {
    color: "#fff",
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  demoButton: {
    backgroundColor: "#2d3436",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#636e72",
    borderStyle: "dashed",
  },
  demoButtonText: {
    color: "#b2bec3",
    fontSize: 14,
  },

  // Photo Confirm Screen
  swipeHint: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  confirmPhotoScroll: {
    marginBottom: 30,
  },
  confirmPhotoScrollContent: {
    gap: 0,
  },
  confirmPhotoSlide: {
    width: SCREEN_WIDTH - 40,
    alignItems: "center",
  },
  confirmPhotoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  confirmPhotoLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  confirmPhotoLarge: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: 16,
    backgroundColor: "#1a1a2e",
  },
  // Legacy styles kept for compatibility
  confirmPhotos: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  confirmPhotoCard: {
    flex: 1,
    alignItems: "center",
  },
  confirmPhoto: {
    width: "100%",
    aspectRatio: 0.85,
    borderRadius: 12,
  },
  confirmActions: {
    gap: 12,
  },
  retakeButton: {
    backgroundColor: "#1a1a2e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  retakeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#00b894",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  // Gender Selection
  genderOptions: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 40,
  },
  genderCard: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  genderCardActive: {
    borderColor: "#6c5ce7",
    backgroundColor: "#252540",
  },
  genderEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  genderLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  // Analyzing Screen
  analyzingTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 10,
  },
  analyzingSubtitle: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  analyzingSteps: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 30,
  },
  analyzingStep: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 12,
  },
  analyzingNote: {
    color: "#666",
    fontSize: 14,
  },

  // Analysis Result Screen
  overallScoreCard: {
    backgroundColor: "#6c5ce7",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 24,
  },
  overallScoreLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 8,
  },
  overallScoreValue: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "bold",
  },
  overallScoreMax: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 20,
    marginTop: -10,
  },
  stylingPotential: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  analysisSection: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  analysisSectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  propertyRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  propertyItem: {
    flex: 1,
    backgroundColor: "#252540",
    borderRadius: 12,
    padding: 12,
  },
  propertyLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  propertyValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  conditionDesc: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  recommendationBullet: {
    color: "#6c5ce7",
    fontSize: 16,
    marginRight: 8,
  },
  recommendationText: {
    color: "#ccc",
    fontSize: 14,
    flex: 1,
  },

  // Style Selection
  analysisStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252540",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  analysisStatusText: {
    color: "#888",
    fontSize: 14,
  },
  analysisCompleteBanner: {
    backgroundColor: "rgba(0, 184, 148, 0.15)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#00b894",
  },
  analysisCompleteText: {
    color: "#00b894",
    fontSize: 14,
    textAlign: "center",
  },
  sectionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  styleChip: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  styleChipActive: {
    backgroundColor: "#6c5ce7",
    borderColor: "#6c5ce7",
  },
  styleChipText: {
    color: "#ccc",
    fontSize: 14,
  },
  styleChipTextActive: {
    color: "#fff",
  },
  urlInput: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 12,
  },
  uploadRefButton: {
    backgroundColor: "#252540",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  uploadRefButtonText: {
    color: "#fff",
    fontSize: 16,
  },

  // Length Selection
  lengthOptions: {
    gap: 12,
    marginBottom: 20,
  },
  lengthOption: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  lengthOptionActive: {
    borderColor: "#6c5ce7",
    backgroundColor: "#252540",
  },
  lengthLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  lengthLabelActive: {
    color: "#6c5ce7",
  },
  lengthDesc: {
    color: "#888",
    fontSize: 14,
  },

  // Color Selection
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: (SCREEN_WIDTH - 72) / 4,
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionActive: {
    borderColor: "#6c5ce7",
    backgroundColor: "#252540",
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#333",
    marginBottom: 6,
  },
  naturalSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a2e",
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  naturalSwatchText: {
    fontSize: 20,
  },
  colorName: {
    color: "#888",
    fontSize: 11,
    textAlign: "center",
  },
  colorNameActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // Feasibility Screen
  assessingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  assessingText: {
    color: "#fff",
    fontSize: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  assessingSubtext: {
    color: "#888",
    fontSize: 14,
  },
  feasibilityHeader: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  feasibilityPass: {
    backgroundColor: "rgba(0, 184, 148, 0.15)",
    borderWidth: 1,
    borderColor: "#00b894",
  },
  feasibilityFail: {
    backgroundColor: "rgba(253, 203, 110, 0.15)",
    borderWidth: 1,
    borderColor: "#fdcb6e",
  },
  feasibilityEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  feasibilityStatus: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  feasibilityScore: {
    color: "#888",
    fontSize: 18,
  },
  compatibilitySection: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  compatibilityTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  compatibilityDesc: {
    color: "#888",
    fontSize: 13,
    marginBottom: 16,
    marginTop: -4,
  },
  growthTime: {
    color: "#fdcb6e",
    fontSize: 13,
    marginBottom: 16,
    marginTop: -8,
  },
  salonInfoSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  salonInfoItem: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  salonInfoLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 6,
  },
  salonInfoValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  concernsSection: {
    backgroundColor: "rgba(253, 203, 110, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  concernsTitle: {
    color: "#fdcb6e",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  concernItem: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 6,
  },
  suggestionsSection: {
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    color: "#00b894",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  suggestionItem: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 6,
  },
  notesSection: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  notesText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 22,
  },
  generateButton: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  generateButtonNote: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 6,
  },
  notFeasibleActions: {
    gap: 12,
    marginTop: 10,
  },
  modifyStyleButton: {
    backgroundColor: "#1a1a2e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  modifyStyleText: {
    color: "#fff",
    fontSize: 16,
  },
  generateAnywayButton: {
    backgroundColor: "#fdcb6e",
  },

  // Generating Screen
  generatingEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  generatingTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  generatingSubtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
  },
  generatingProgressContainer: {
    width: "100%",
    marginBottom: 30,
  },
  generatingProgressBar: {
    height: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  generatingProgressFill: {
    height: "100%",
    backgroundColor: "#6c5ce7",
    borderRadius: 4,
  },
  generatingProgressText: {
    color: "#6c5ce7",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  generatingSteps: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 30,
  },
  generatingStep: {
    color: "#888",
    fontSize: 14,
    marginBottom: 10,
  },
  generatingStepDone: {
    color: "#00b894",
  },
  generatingStepActive: {
    color: "#6c5ce7",
  },
  generatingStepNote: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  patienceBox: {
    backgroundColor: "#252540",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  patienceEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  patienceTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  patienceText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },

  // Result Screen
  resultTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  resultSubtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  comparisonRow: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  comparisonRowTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  comparisonImages: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  comparisonImageBox: {
    flex: 1,
    alignItems: "center",
  },
  comparisonImageLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  comparisonImage: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 12,
  },
  comparisonArrow: {
    paddingHorizontal: 12,
  },
  arrowText: {
    color: "#6c5ce7",
    fontSize: 24,
    fontWeight: "bold",
  },
  // Legacy styles (kept for compatibility)
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 12,
  },
  originalPhotos: {
    flexDirection: "row",
    gap: 12,
  },
  comparisonSmall: {
    flex: 1,
    height: 100,
    borderRadius: 12,
  },
  generatedLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  resultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  resultImageContainer: {
    width: (SCREEN_WIDTH - 52) / 2,
  },
  resultImage: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 12,
  },
  resultImageLabel: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  tryAnotherButton: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  tryAnotherText: {
    color: "#fff",
    fontSize: 16,
  },
  newClientButton: {
    flex: 1,
    backgroundColor: "#6c5ce7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  newClientText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimer: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  // Common
  primaryButton: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
});
