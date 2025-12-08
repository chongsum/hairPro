import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";

// Services
import { generateHairstyle } from "./src/services/falai";
import { analyzeHair, HairAnalysis } from "./src/services/openrouter";
import { analyzeRefImageHairstyle } from "./src/services/refImageAnalysis";

// Utils
import { resizeAndCompressImage } from "./src/utils/image";

// Constants
import {
  HAIR_COLORS,
  HAIR_LENGTH_FILTERS,
  HAIRSTYLES_BY_LENGTH,
} from "./src/constants";

// Types
import { Screen, Gender, FlowType, UserPhoto, RefImage } from "./src/types";

// Demo image for development
const DEMO_FRONT_IMAGE = require("./assets/demo_front.jpg");

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============ MAIN APP ============
export default function App() {
  // Navigation state
  const [screen, setScreen] = useState<Screen>("initial");
  const [flowType, setFlowType] = useState<FlowType>("style");

  // User preferences
  const [gender, setGender] = useState<Gender>("female");

  // Image state
  const [userPhoto, setUserPhoto] = useState<UserPhoto | null>(null);

  // Reference image state
  const [refImage, setRefImage] = useState<RefImage | null>(null);
  const [refImageDescription, setRefImageDescription] = useState<string>("");
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const [refAnalysisFailed, setRefAnalysisFailed] = useState(false);
  const [refUrlInput, setRefUrlInput] = useState<string>("");

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

  // ============ HELPER FUNCTIONS ============

  // Get filtered hairstyles
  const getFilteredHairstyles = useCallback(() => {
    const allStyles = HAIRSTYLES_BY_LENGTH[gender];
    if (selectedLengthFilter === "all") {
      return Object.values(allStyles).flat();
    }
    return allStyles[selectedLengthFilter as keyof typeof allStyles] || [];
  }, [gender, selectedLengthFilter]);

  // Reset app state
  const resetApp = () => {
    setScreen("initial");
    setFlowType("style");
    setUserPhoto(null);
    setRefImage(null);
    setRefImageDescription("");
    setRefAnalysisFailed(false);
    setRefUrlInput("");
    setHairAnalysis(null);
    setSelectedStyle("");
    setSelectedColor("natural");
    setSelectedLengthFilter("all");
    setGeneratedImage(null);
    setGenerationProgress(0);
    setShowCamera(false);
  };

  // ============ IMAGE FUNCTIONS ============

  // Camera capture
  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        const compressed = await resizeAndCompressImage(photo.uri);
        setUserPhoto(compressed);
        setShowCamera(false);
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
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await resizeAndCompressImage(result.assets[0].uri);
        setUserPhoto(compressed);
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
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await resizeAndCompressImage(result.assets[0].uri);
        setRefImage({ uri: compressed.uri, base64: compressed.base64 });
        analyzeRefImage(compressed.base64);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick reference image");
    }
  };

  // Use demo photo
  const useDemoPhoto = async () => {
    try {
      const resolved = Image.resolveAssetSource(DEMO_FRONT_IMAGE);
      const uri = resolved.uri;
      console.log("Loading demo photo from:", uri);

      const response = await fetch(uri);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log(
        `Demo photo loaded: ${Math.round((base64.length * 0.75) / 1024)}KB`
      );
      setUserPhoto({ uri, base64 });
      setScreen("photoConfirm");
    } catch (error) {
      console.error("Error loading demo photo:", error);
      Alert.alert("Error", "Failed to load demo photo.");
    }
  };

  // ============ ANALYSIS FUNCTIONS ============

  // Analyze reference image
  const analyzeRefImage = async (imageData: string) => {
    setIsAnalyzingRef(true);
    setRefAnalysisFailed(false);
    setRefImageDescription("");
    try {
      const description = await analyzeRefImageHairstyle(imageData);
      if (
        !description ||
        description.toLowerCase().includes("unable to analyze")
      ) {
        throw new Error("Failed to analyze hairstyle");
      }
      setRefImageDescription(description);
      setRefAnalysisFailed(false);
    } catch (error) {
      console.error("Failed to analyze reference image:", error);
      setRefImageDescription("");
      setRefAnalysisFailed(true);
      Alert.alert(
        "Analysis Failed",
        "Could not analyze the hairstyle from this image. Please try a different reference image with a clearer view of the hairstyle.",
        [{ text: "OK" }]
      );
    } finally {
      setIsAnalyzingRef(false);
    }
  };

  // ============ GENERATION FUNCTION ============

  const generateImages = useCallback(async () => {
    if (!userPhoto?.base64) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep("Preparing your photo...");
    setScreen("generating");

    try {
      // Step 1: Analyze hair (0-30%)
      setGenerationStep("Analyzing your hair characteristics...");
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

      // Build the hairstyle description
      let hairstyleDetails = "";
      if (flowType === "ref" && refImageDescription) {
        hairstyleDetails = refImageDescription;
      } else {
        hairstyleDetails = `${selectedStyle} hairstyle`;
      }

      // Handle color - either new color or keep natural
      const colorName =
        HAIR_COLORS.find((c) => c.id === selectedColor)?.name || "";
      const isNaturalColor = !colorName || colorName === "Natural";
      
      let colorInstruction = "";
      if (isNaturalColor) {
        // Explicitly instruct to keep original color
        colorInstruction = "KEEP the person's original/natural hair color exactly as-is";
      } else {
        hairstyleDetails += ` with ${colorName} hair color`;
        colorInstruction = `Change hair color to ${colorName}`;
      }

      // Build context from hair analysis
      let hairContext = "";
      if (analysis) {
        hairContext = `The person has ${analysis.hairTexture.value} hair texture, ${analysis.hairDensity.value} density, and ${analysis.faceShape.value} face shape.`;
      }

      // Build comprehensive prompt for photorealistic hair transformation
      const styleDescription = `
TASK: Professional virtual hairstyle try-on. Transform ONLY the hair to show: ${hairstyleDetails}.

HAIR COLOR: ${colorInstruction}

HAIR REQUIREMENTS:
- Photorealistic, salon-quality ${gender === "female" ? "women's" : "men's"} hairstyle
- Natural hair physics: proper weight, gravity, volume, and movement
- Realistic hair texture with individual strand detail and natural shine
- Seamless blend at hairline, temples, and nape
- Style must be practically achievable by a professional hairstylist
${hairContext ? `- Consider: ${hairContext}` : ""}

STRICT PRESERVATION (DO NOT MODIFY):
- Face: Keep exact facial features, skin tone, expression, makeup unchanged
- No face enhancement, beautification, smoothing, or reshaping
- Eyes, eyebrows, nose, ears, lips must remain identical to original
- Body, clothing, jewelry, accessories unchanged
- Background and lighting unchanged
- Image composition and framing unchanged
${isNaturalColor ? "- Hair color: MUST remain the person's original/natural hair color" : ""}

OUTPUT: Single photorealistic image showing only the new hairstyle applied naturally to this exact person.
`.trim();

      console.log("Generation prompt:", styleDescription);

      const progressInterval2 = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 1, 95));
      }, 700);

      // For ref image: use base64 data URL if available (uploaded), otherwise use URI (pasted URL)
      let refImageForApi: string | undefined;
      if (flowType === "ref" && refImage) {
        console.log("=== REF IMAGE FOR GENERATION ===");
        console.log("refImage.uri:", refImage.uri?.substring(0, 50) + "...");
        console.log("refImage.base64 exists:", !!refImage.base64);
        console.log("refImage.base64 length:", refImage.base64?.length || 0);
        
        if (refImage.base64) {
          // Uploaded image - convert base64 to data URL
          refImageForApi = refImage.base64.startsWith("data:")
            ? refImage.base64
            : `data:image/jpeg;base64,${refImage.base64}`;
          console.log("Using base64 data URL for ref image");
        } else if (refImage.uri.startsWith("http")) {
          // Pasted URL - use directly
          refImageForApi = refImage.uri;
          console.log("Using URL for ref image:", refImageForApi);
        }
        console.log("refImageForApi length:", refImageForApi?.length || 0);
      }

      const result = await generateHairstyle(
        userPhoto.base64,
        styleDescription,
        gender,
        refImageForApi
      );

      clearInterval(progressInterval2);
      setGenerationProgress(100);
      setGenerationStep("Complete!");
      setGeneratedImage(result);

      setTimeout(() => setScreen("result"), 500);
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

  // ============ SCREENS ============

  // INITIAL SCREEN
  if (screen === "initial") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.initialContent}>
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>✂️</Text>
            <Text style={styles.logoTitle}>HairPro</Text>
            <Text style={styles.logoSubtitle}>AI Hairstyle Preview</Text>
          </View>

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
            <View style={styles.cameraOverlay}>
              <View style={styles.faceGuide} />
              <Text style={styles.cameraHint}>
                Position your face in the circle
              </Text>
            </View>
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

          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>📋 For Best Results</Text>
            <Text style={styles.tipItem}>• Good, even lighting</Text>
            <Text style={styles.tipItem}>• Face the camera directly</Text>
            <Text style={styles.tipItem}>
              • Show your full face and hairline
            </Text>
            <Text style={styles.tipItem}>• Neutral background preferred</Text>
          </View>

          <TouchableOpacity style={styles.demoButton} onPress={useDemoPhoto}>
            <Text style={styles.demoButtonText}>🧪 Use Demo Photo (Dev)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // PHOTO CONFIRM SCREEN
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

          <View style={styles.photoConfirmPreview}>
            {userPhoto && (
              <Image
                source={{ uri: userPhoto.uri }}
                style={styles.photoConfirmImage}
                resizeMode="cover"
              />
            )}
          </View>

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
              onPress={() =>
                setScreen(flowType === "style" ? "styleSelect" : "refUpload")
              }
            >
              <Text style={styles.confirmPhotoButtonText}>Looks Good ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // STYLE SELECT SCREEN
  if (screen === "styleSelect") {
    const filteredStyles = getFilteredHairstyles();

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.styleSelectContainer}>
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

          <View style={styles.colorPickerSection}>
            <Text style={styles.colorPickerLabel}>Hair Color</Text>
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

  // REF UPLOAD SCREEN
  if (screen === "refUpload") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.refUploadContent}>
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

                {isAnalyzingRef && (
                  <View style={styles.refAnalyzingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.refAnalyzingText}>
                      Analyzing hairstyle...
                    </Text>
                  </View>
                )}

                {refImageDescription &&
                  !isAnalyzingRef &&
                  !refAnalysisFailed && (
                    <View style={styles.refDescriptionBox}>
                      <Text style={styles.refDescriptionLabel}>
                        AI Analysis:
                      </Text>
                      <Text style={styles.refDescriptionText}>
                        {refImageDescription}
                      </Text>
                    </View>
                  )}

                {refAnalysisFailed && !isAnalyzingRef && (
                  <View style={styles.refErrorBox}>
                    <Text style={styles.refErrorIcon}>⚠️</Text>
                    <Text style={styles.refErrorText}>
                      Could not analyze this image. Please try a different
                      reference photo with a clearer view of the hairstyle.
                    </Text>
                    <TouchableOpacity
                      style={styles.refRetryButton}
                      onPress={() => {
                        setRefImage(null);
                        setRefAnalysisFailed(false);
                      }}
                    >
                      <Text style={styles.refRetryButtonText}>
                        Try Another Image
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.refUploadCard}
                  onPress={pickRefImage}
                >
                  <Text style={styles.refUploadIcon}>📷</Text>
                  <Text style={styles.refUploadText}>
                    Upload Reference Image
                  </Text>
                </TouchableOpacity>

                <Text style={styles.orDivider}>— or paste URL —</Text>
                <View style={styles.urlInputRow}>
                  <TextInput
                    style={styles.urlInputField}
                    placeholder="https://example.com/hairstyle.jpg"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={refUrlInput}
                    onChangeText={setRefUrlInput}
                    onSubmitEditing={() => {
                      if (refUrlInput.startsWith("http")) {
                        setRefImage({ uri: refUrlInput });
                        analyzeRefImage(refUrlInput);
                        setRefUrlInput("");
                      }
                    }}
                  />
                  {refUrlInput.startsWith("http") && (
                    <TouchableOpacity
                      style={styles.urlLoadButton}
                      onPress={() => {
                        setRefImage({ uri: refUrlInput });
                        analyzeRefImage(refUrlInput);
                        setRefUrlInput("");
                      }}
                    >
                      <Text style={styles.urlLoadButtonText}>Load</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>For Best Results</Text>
              <Text style={styles.warningText}>
                • Use a close-up face shot showing the full hairstyle{"\n"}•
                Front-facing reference images work best
                {"\n"}• Ensure the hair is clearly visible{"\n"}• Side or angled
                photos may produce less accurate results
              </Text>
            </View>
          </View>

          {refImage &&
            refImageDescription &&
            !isAnalyzingRef &&
            !refAnalysisFailed && (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateImages}
              >
                <Text style={styles.generateButtonText}>
                  Generate Preview ✨
                </Text>
              </TouchableOpacity>
            )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // GENERATING SCREEN
  if (screen === "generating") {
    const perceivedSeconds =
      Math.floor((60 * (100 - generationProgress)) / 100) % 60;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.generatingContent}>
          <View style={styles.generatingIconContainer}>
            <Text style={styles.generatingIcon}>✨</Text>
          </View>

          <Text style={styles.generatingTitle}>Creating Your Look</Text>
          <Text style={styles.generatingSubtitle}>{generationStep}</Text>

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

          <View style={styles.timeEstimate}>
            <Text style={styles.timeEstimateLabel}>
              Estimated time remaining
            </Text>
            <Text style={styles.timeEstimateValue}>
              ~{perceivedSeconds > 0 ? `${perceivedSeconds}s` : "Almost done!"}
            </Text>
          </View>

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

  // RESULT SCREEN
  if (screen === "result") {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <StatusBar style="light" />

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Your New Look</Text>
        </View>

        <View style={styles.comparisonContainer}>
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

          <View style={styles.comparisonDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerIcon}>↓</Text>
            <View style={styles.dividerLine} />
          </View>

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
  container: { flex: 1, backgroundColor: "#0a0a0f" },

  // Initial Screen
  initialContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  logoSection: { alignItems: "center", marginBottom: 40 },
  logoEmoji: { fontSize: 64, marginBottom: 8 },
  logoTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  logoSubtitle: { fontSize: 16, color: "#666", marginTop: 4 },
  selectionSection: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  genderRow: { flexDirection: "row", gap: 12 },
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
  genderPillActive: { borderColor: "#7c5cff", backgroundColor: "#1f1a30" },
  genderEmoji: { fontSize: 24 },
  genderText: { fontSize: 16, color: "#888", fontWeight: "600" },
  genderTextActive: { color: "#fff" },
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
  flowCardActive: { borderColor: "#7c5cff", backgroundColor: "#1f1a30" },
  flowCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#252530",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  flowEmoji: { fontSize: 24 },
  flowCardContent: { flex: 1 },
  flowCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  flowCardDesc: { fontSize: 13, color: "#666", lineHeight: 18 },
  flowCardCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7c5cff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  primaryButton: {
    backgroundColor: "#7c5cff",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  primaryButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Photo Capture
  photoCaptureContent: { flex: 1, padding: 24, paddingTop: 16 },
  backButton: { marginBottom: 20 },
  backText: { color: "#7c5cff", fontSize: 16, fontWeight: "600" },
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
  photoOptions: { flexDirection: "row", gap: 16, marginBottom: 32 },
  photoOptionCard: {
    flex: 1,
    backgroundColor: "#1a1a24",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  photoOptionIcon: { fontSize: 40, marginBottom: 12 },
  photoOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  photoOptionDesc: { fontSize: 12, color: "#666" },
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
  tipItem: { fontSize: 14, color: "#888", marginBottom: 6, lineHeight: 20 },
  demoButton: {
    backgroundColor: "rgba(124, 92, 255, 0.2)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  demoButtonText: { color: "#7c5cff", fontSize: 15, fontWeight: "600" },

  // Photo Confirm
  photoConfirmContent: { flex: 1, padding: 24, paddingTop: 16 },
  photoConfirmPreview: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a1a24",
    marginVertical: 20,
  },
  photoConfirmImage: { width: "100%", height: "100%" },
  photoConfirmActions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  retakeButton: {
    flex: 1,
    backgroundColor: "#1a1a24",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  retakeButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  confirmPhotoButton: {
    flex: 1,
    backgroundColor: "#00b894",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmPhotoButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
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
  cameraBackText: { color: "#fff", fontSize: 24 },
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
  cameraPlaceholder: { width: 50 },

  // Style Select
  styleSelectContainer: { flex: 1 },
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
  colorPickerSection: { paddingTop: 8, paddingBottom: 16 },
  colorPickerLabel: {
    fontSize: 13,
    color: "#888",
    marginLeft: 16,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colorPickerList: { paddingHorizontal: 12, gap: 8 },
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
  colorDotNaturalText: { fontSize: 16 },
  colorChipText: { fontSize: 11, color: "#888", textAlign: "center" },
  colorChipTextActive: { color: "#fff", fontWeight: "600" },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a24",
    paddingBottom: 12,
  },
  filterList: { paddingHorizontal: 12, gap: 8 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#1a1a24",
  },
  filterChipActive: { backgroundColor: "#7c5cff" },
  filterChipText: { fontSize: 14, color: "#888", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  stylesScrollView: { flex: 1 },
  stylesGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  styleCard: {
    width: (SCREEN_WIDTH - 48) / 3,
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleCardActive: { borderColor: "#7c5cff", backgroundColor: "#1f1a30" },
  stylePreviewPlaceholder: {
    width: "100%",
    aspectRatio: 0.85,
    backgroundColor: "#252530",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stylePreviewIcon: { fontSize: 32, opacity: 0.5 },
  styleCardText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 16,
  },
  styleCardTextActive: { color: "#fff", fontWeight: "600" },
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
  checkMarkSmall: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  generateButton: {
    backgroundColor: "#7c5cff",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  generateButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Ref Upload
  refUploadContent: { flexGrow: 1, padding: 24, paddingTop: 16 },
  refImageSection: { marginTop: 16, marginBottom: 24 },
  refPreviewContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  refPreviewImage: { width: "100%", aspectRatio: 1, borderRadius: 16 },
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
  refRemoveText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  refAnalyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  refAnalyzingText: { color: "#fff", fontSize: 16, marginTop: 12 },
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
  refDescriptionText: { fontSize: 14, color: "#ccc", lineHeight: 22 },
  refErrorBox: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(231, 76, 60, 0.4)",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  refErrorIcon: { fontSize: 32, marginBottom: 8 },
  refErrorText: {
    fontSize: 14,
    color: "#e74c3c",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  refRetryButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  refRetryButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  refUploadCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#252530",
    borderStyle: "dashed",
  },
  refUploadIcon: { fontSize: 48, marginBottom: 12 },
  refUploadText: { fontSize: 16, color: "#888" },
  orDivider: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    marginVertical: 20,
  },
  urlInputRow: { flexDirection: "row", gap: 10 },
  urlInputField: {
    flex: 1,
    backgroundColor: "#1a1a24",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#252530",
  },
  urlLoadButton: {
    backgroundColor: "#7c5cff",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  urlLoadButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.3)",
  },
  warningIcon: { fontSize: 24, marginRight: 12 },
  warningContent: { flex: 1 },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffc107",
    marginBottom: 8,
  },
  warningText: { fontSize: 13, color: "#bbb", lineHeight: 20 },

  // Generating
  generatingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  generatingIconContainer: { marginBottom: 24 },
  generatingIcon: { fontSize: 72 },
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
  progressContainer: { width: "100%", marginBottom: 24 },
  progressBar: {
    height: 8,
    backgroundColor: "#1a1a24",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#7c5cff", borderRadius: 4 },
  progressText: {
    fontSize: 16,
    color: "#7c5cff",
    fontWeight: "700",
    textAlign: "center",
  },
  timeEstimate: { alignItems: "center", marginBottom: 40 },
  timeEstimateLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  timeEstimateValue: { fontSize: 18, color: "#fff", fontWeight: "600" },
  funFactBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 16,
    width: "100%",
  },
  funFactIcon: { fontSize: 24, marginRight: 12 },
  funFactText: { flex: 1, fontSize: 14, color: "#888", lineHeight: 20 },

  // Result
  resultContainer: { flex: 1, backgroundColor: "#0a0a0f" },
  resultHeader: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a24",
  },
  resultTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  comparisonContainer: { flex: 1, padding: 16 },
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
  comparisonImageFull: { width: "100%", height: "100%" },
  comparisonDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#252530" },
  dividerIcon: { fontSize: 20, color: "#7c5cff", marginHorizontal: 12 },
  resultActions: { flexDirection: "row", padding: 16, gap: 12 },
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
  resultActionText: { fontSize: 16, color: "#fff", fontWeight: "600" },
  resultActionTextPrimary: { fontSize: 16, color: "#fff", fontWeight: "700" },

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
