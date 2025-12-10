import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";

// Services
import { generateHairstyle } from "./src/services/falai";
import { buildHairstyleGenerationPrompt } from "./src/services/prompts";
import { analyzeHair, HairAnalysis } from "./src/services/openrouter";
import { analyzeRefImageHairstyle } from "./src/services/refImageAnalysis";
import {
  loadHistory,
  saveToHistory,
  deleteHistoryItem,
  clearHistory,
  HistoryItem,
} from "./src/services/historyService";

// Utils
import { resizeAndCompressImage } from "./src/utils/image";

// Constants
import {
  HAIR_COLORS,
  HAIR_LENGTH_FILTERS,
  HAIRSTYLES_BY_LENGTH,
  getHairstyleDescription,
} from "./src/constants";

// Translations
import {
  Language,
  t,
  getHairstyleName,
  getHairstyleDesc,
  getFilterLabel,
  getColorName,
} from "./src/constants/translations";

// Models
import {
  SUPPORTED_MODELS,
  ImageModel,
  getDefaultModel,
} from "./src/constants/models";

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

  // Language state
  const [language, setLanguage] = useState<Language>("en");

  // Model state
  const [selectedModel, setSelectedModel] = useState<ImageModel>(
    getDefaultModel()
  );
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Hair analysis toggle
  const [hairAnalysisEnabled, setHairAnalysisEnabled] = useState(true);

  // User preferences
  const [gender, setGender] = useState<Gender>("male");

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
  const [cachedAnalysisUri, setCachedAnalysisUri] = useState<string | null>(
    null
  ); // Track which photo the analysis belongs to

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

  // History states
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<HistoryItem | null>(null);

  // ============ HISTORY LOADING ============

  // Load history on mount
  useEffect(() => {
    const loadHistoryData = async () => {
      const history = await loadHistory();
      setHistoryItems(history);
    };
    loadHistoryData();
  }, []);

  // ============ HELPER FUNCTIONS ============

  // Get filtered hairstyles
  const getFilteredHairstyles = useCallback(() => {
    const allStyles = HAIRSTYLES_BY_LENGTH[gender];
    if (selectedLengthFilter === "all") {
      return Object.values(allStyles).flat();
    }
    return allStyles[selectedLengthFilter as keyof typeof allStyles] || [];
  }, [gender, selectedLengthFilter]);

  // Get preview image for a style from history (most recent generation for that style)
  const getStylePreviewImage = useCallback(
    (styleName: string): string | null => {
      // Find the most recent history item with this style name and matching gender
      const historyItem = historyItems.find(
        (item) =>
          item.styleName === styleName &&
          item.gender === gender &&
          item.flowType === "style"
      );
      return historyItem?.imageUri || null;
    },
    [historyItems, gender]
  );

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
    setCachedAnalysisUri(null);
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
      let analysis: HairAnalysis | null = null;

      if (hairAnalysisEnabled) {
        // Check if we have a cached analysis for the same photo
        if (userPhoto.uri === cachedAnalysisUri && hairAnalysis) {
          console.log("=== USING CACHED HAIR ANALYSIS ===");
          analysis = hairAnalysis;
          setGenerationStep("Using cached hair analysis...");
          setGenerationProgress(30);
        } else {
          setGenerationStep("Analyzing your hair characteristics...");
          const progressInterval1 = setInterval(() => {
            setGenerationProgress((prev) => Math.min(prev + 1, 30));
          }, 600);

          try {
            analysis = await analyzeHair(
              userPhoto.base64,
              userPhoto.base64,
              gender
            );
            setHairAnalysis(analysis);
            setCachedAnalysisUri(userPhoto.uri); // Cache the URI for future use
          } catch (err) {
            console.error("Hair analysis failed:", err);
          }

          clearInterval(progressInterval1);
        }
      } else {
        // Skip analysis, quickly progress to 30%
        setGenerationStep("Preparing your photo...");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setGenerationProgress(30);

      // Step 2: Build prompt and generate (30-95%)
      setGenerationStep("Creating your new hairstyle...");

      // ============================================================
      // BUILD PROMPT USING CENTRALIZED SYSTEM (see src/services/prompts.ts)
      // ============================================================

      // Get target hairstyle description
      let targetHairstyleDescription = "";
      if (flowType === "ref" && refImageDescription) {
        // PATH 2: Reference Image - use analyzed description
        targetHairstyleDescription = refImageDescription;
      } else {
        // PATH 1: Style Selection - use stored professional description
        const professionalDescription = getHairstyleDescription(
          selectedStyle,
          gender
        );
        targetHairstyleDescription = `${selectedStyle} - ${professionalDescription}`;
      }

      // Get color setting
      const colorName =
        HAIR_COLORS.find((c) => c.id === selectedColor)?.name || "Natural";

      // Build user hair analysis string
      let userHairAnalysis = "";
      if (analysis) {
        userHairAnalysis = `Hair texture: ${analysis.hairTexture.value}, Density: ${analysis.hairDensity.value}, Face shape: ${analysis.faceShape.value}`;
      }

      console.log(
        "Target hairstyle:",
        targetHairstyleDescription.substring(0, 100) + "..."
      );

      const progressInterval2 = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 1, 95));
      }, 700);

      // Build the comprehensive prompt (same for both paths)
      const finalPrompt = buildHairstyleGenerationPrompt({
        userHairAnalysis,
        targetHairstyleDescription,
        hairColor: colorName,
        gender,
      });

      console.log("Final prompt:", finalPrompt.substring(0, 200) + "...");

      // Generate hairstyle using user photo + text description
      const result = await generateHairstyle(
        userPhoto.base64,
        finalPrompt,
        gender,
        selectedModel
      );

      clearInterval(progressInterval2);
      setGenerationProgress(100);
      setGenerationStep("Saving to history...");
      setGeneratedImage(result);

      // Save to history
      try {
        const styleName =
          flowType === "ref" ? "Reference Style" : selectedStyle;
        const historyItem = await saveToHistory(
          result,
          userPhoto.uri,
          styleName,
          gender,
          selectedColor,
          flowType,
          flowType === "ref" ? refImage?.uri : undefined,
          selectedModel.id,
          selectedModel.name
        );
        setHistoryItems((prev) => [historyItem, ...prev]);
      } catch (historyError) {
        console.error("Failed to save to history:", historyError);
      }

      setGenerationStep("Complete!");
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
    selectedModel,
    hairAnalysisEnabled,
    cachedAnalysisUri,
    hairAnalysis,
  ]);

  // ============ SCREENS ============

  // INITIAL SCREEN
  if (screen === "initial") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* Model Selector Modal */}
        <Modal
          visible={showModelSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModelSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("selectModel", language)}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowModelSelector(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modelList}>
                {SUPPORTED_MODELS.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelItem,
                      selectedModel.id === model.id && styles.modelItemActive,
                    ]}
                    onPress={() => {
                      setSelectedModel(model);
                      setShowModelSelector(false);
                    }}
                  >
                    <View style={styles.modelItemContent}>
                      <Text style={styles.modelItemName}>{model.name}</Text>
                      <Text style={styles.modelItemDesc}>
                        {model.description[language]}
                      </Text>
                      <Text style={styles.modelItemEndpoint}>
                        {model.endpoint}
                      </Text>
                    </View>
                    {selectedModel.id === model.id && (
                      <View style={styles.modelItemCheck}>
                        <Text style={styles.modelItemCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.initialContent}>
          {/* Language Toggle */}
          <TouchableOpacity
            style={styles.languageToggle}
            onPress={() => setLanguage(language === "en" ? "zh-TW" : "en")}
          >
            <Text style={styles.languageToggleText}>
              {language === "en" ? "中文" : "EN"}
            </Text>
          </TouchableOpacity>

          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>✂️</Text>
            <Text style={styles.logoTitle}>{t("appName", language)}</Text>
            <Text style={styles.logoSubtitle}>
              {t("appSubtitle", language)}
            </Text>
          </View>

          <View style={styles.selectionSection}>
            <Text style={styles.sectionLabel}>{t("iAm", language)}</Text>
            <View style={styles.genderRow}>
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
                  {t("male", language)}
                </Text>
              </TouchableOpacity>

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
                  {t("female", language)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.selectionSection}>
            <Text style={styles.sectionLabel}>{t("iWantTo", language)}</Text>

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
                <Text style={styles.flowCardTitle}>
                  {t("browseStyles", language)}
                </Text>
                <Text style={styles.flowCardDesc}>
                  {t("browseStylesDesc", language)}
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
                <Text style={styles.flowCardTitle}>
                  {t("useRefImage", language)}
                </Text>
                <Text style={styles.flowCardDesc}>
                  {t("useRefImageDesc", language)}
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
            <Text style={styles.primaryButtonText}>
              {t("continue", language)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButtonInitial}
            onPress={() => setScreen("history")}
          >
            <Text style={styles.historyButtonInitialText}>
              📸 {t("myHairstyles", language)}
              {historyItems.length > 0 ? ` (${historyItems.length})` : ""}
            </Text>
          </TouchableOpacity>

          {/* Model Selector Button */}
          <TouchableOpacity
            style={styles.modelSelectorButton}
            onPress={() => setShowModelSelector(true)}
          >
            <Text style={styles.modelSelectorLabel}>
              {t("aiModel", language)}
            </Text>
            <Text style={styles.modelSelectorValue}>{selectedModel.name}</Text>
          </TouchableOpacity>

          {/* Hair Analysis Toggle */}
          <TouchableOpacity
            style={styles.settingsToggleButton}
            onPress={() => setHairAnalysisEnabled(!hairAnalysisEnabled)}
          >
            <View style={styles.settingsToggleContent}>
              <Text style={styles.settingsToggleLabel}>
                {language === "en" ? "Hair Analysis" : "髮質分析"}
              </Text>
              <Text style={styles.settingsToggleDesc}>
                {language === "en"
                  ? "Analyze hair texture & face shape"
                  : "分析髮質和臉型"}
              </Text>
            </View>
            <View
              style={[
                styles.settingsToggleSwitch,
                hairAnalysisEnabled && styles.settingsToggleSwitchOn,
              ]}
            >
              <Text style={styles.settingsToggleSwitchText}>
                {hairAnalysisEnabled ? "ON" : "OFF"}
              </Text>
            </View>
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
                {t("cameraPermissionRequired", language)}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={requestPermission}
              >
                <Text style={styles.primaryButtonText}>
                  {t("grantPermission", language)}
                </Text>
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
                {t("positionFace", language)}
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
            <Text style={styles.backText}>← {t("back", language)}</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>{t("takeYourPhoto", language)}</Text>
          <Text style={styles.screenSubtitle}>
            {t("photoSubtitle", language)}
          </Text>

          <View style={styles.photoOptions}>
            <TouchableOpacity
              style={styles.photoOptionCard}
              onPress={async () => {
                if (!permission?.granted) {
                  const result = await requestPermission();
                  if (!result.granted) {
                    Alert.alert(t("cameraAccessRequired", language));
                    return;
                  }
                }
                setShowCamera(true);
              }}
            >
              <Text style={styles.photoOptionIcon}>📸</Text>
              <Text style={styles.photoOptionTitle}>
                {t("takeSelfie", language)}
              </Text>
              <Text style={styles.photoOptionDesc}>
                {t("useCamera", language)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoOptionCard}
              onPress={pickImage}
            >
              <Text style={styles.photoOptionIcon}>🖼️</Text>
              <Text style={styles.photoOptionTitle}>
                {t("uploadPhoto", language)}
              </Text>
              <Text style={styles.photoOptionDesc}>
                {t("fromGallery", language)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>
              📋 {t("forBestResults", language)}
            </Text>
            <Text style={styles.tipItem}>• {t("tipLighting", language)}</Text>
            <Text style={styles.tipItem}>• {t("tipFaceCamera", language)}</Text>
            <Text style={styles.tipItem}>• {t("tipShowFace", language)}</Text>
            <Text style={styles.tipItem}>• {t("tipBackground", language)}</Text>
          </View>

          <TouchableOpacity style={styles.demoButton} onPress={useDemoPhoto}>
            <Text style={styles.demoButtonText}>
              🧪 {t("useDemoPhoto", language)}
            </Text>
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
            <Text style={styles.backText}>← {t("back", language)}</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>
            {t("confirmYourPhoto", language)}
          </Text>
          <Text style={styles.screenSubtitle}>
            {t("confirmSubtitle", language)}
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
              <Text style={styles.retakeButtonText}>
                {t("retakePhoto", language)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmPhotoButton}
              onPress={() =>
                setScreen(flowType === "style" ? "styleSelect" : "refUpload")
              }
            >
              <Text style={styles.confirmPhotoButtonText}>
                {t("looksGood", language)}
              </Text>
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

        {/* Model Selector Modal */}
        <Modal
          visible={showModelSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModelSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("selectModel", language)}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowModelSelector(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modelList}>
                {SUPPORTED_MODELS.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelItem,
                      selectedModel.id === model.id && styles.modelItemActive,
                    ]}
                    onPress={() => {
                      setSelectedModel(model);
                      setShowModelSelector(false);
                    }}
                  >
                    <View style={styles.modelItemContent}>
                      <Text style={styles.modelItemName}>{model.name}</Text>
                      <Text style={styles.modelItemDesc}>
                        {model.description[language]}
                      </Text>
                      <Text style={styles.modelItemEndpoint}>
                        {model.endpoint}
                      </Text>
                    </View>
                    {selectedModel.id === model.id && (
                      <View style={styles.modelItemCheck}>
                        <Text style={styles.modelItemCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.styleSelectContainer}>
          <View style={styles.styleHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setUserPhoto(null);
                setScreen("photoCapture");
              }}
            >
              <Text style={styles.backText}>← {t("back", language)}</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitleSmall}>
              {t("chooseYourStyle", language)}
            </Text>
          </View>

          <View style={styles.colorPickerSection}>
            <Text style={styles.colorPickerLabel}>
              {t("hairColor", language)}
            </Text>
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
                    {getColorName(item.id, language)}
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
                    {getFilterLabel(filter.id, language)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.stylesScrollView}
            contentContainerStyle={styles.stylesGrid}
          >
            {filteredStyles.map((style) => {
              const previewImage = getStylePreviewImage(style);
              const translatedName = getHairstyleName(style, language);
              const translatedDesc = getHairstyleDesc(style, gender, language);
              return (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleCard,
                    selectedStyle === style && styles.styleCardActive,
                  ]}
                  onPress={() => setSelectedStyle(style)}
                >
                  <View style={styles.stylePreviewPlaceholder}>
                    {previewImage ? (
                      <Image
                        source={{ uri: previewImage }}
                        style={styles.stylePreviewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.stylePreviewIcon}>💇</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.styleCardTitle,
                      selectedStyle === style && styles.styleCardTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {translatedName}
                  </Text>
                  <Text
                    style={[
                      styles.styleCardDescription,
                      selectedStyle === style &&
                        styles.styleCardDescriptionActive,
                    ]}
                    numberOfLines={4}
                  >
                    {translatedDesc}
                  </Text>
                  {selectedStyle === style && (
                    <View style={styles.styleCardCheck}>
                      <Text style={styles.checkMarkSmall}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedStyle && (
            <View style={styles.selectedStyleSection}>
              <View style={styles.selectedStyleHeader}>
                <Text style={styles.selectedStyleTitle}>
                  {getHairstyleName(selectedStyle, language)}
                </Text>
                <TouchableOpacity
                  style={styles.selectedStyleCloseBtn}
                  onPress={() => setSelectedStyle("")}
                >
                  <Text style={styles.selectedStyleCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.selectedStyleDescScroll}
                nestedScrollEnabled
              >
                <Text style={styles.selectedStyleDesc}>
                  {getHairstyleDesc(selectedStyle, gender, language)}
                </Text>
              </ScrollView>
              {/* Model Selector */}
              <TouchableOpacity
                style={styles.styleModelSelector}
                onPress={() => setShowModelSelector(true)}
              >
                <Text style={styles.styleModelLabel}>
                  {t("model", language)}:
                </Text>
                <Text style={styles.styleModelName}>{selectedModel.name}</Text>
                <Text style={styles.styleModelIcon}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateImages}
              >
                <Text style={styles.generateButtonText}>
                  {t("generatePreview", language)}
                </Text>
              </TouchableOpacity>
            </View>
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

        {/* Model Selector Modal */}
        <Modal
          visible={showModelSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModelSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("selectModel", language)}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowModelSelector(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modelList}>
                {SUPPORTED_MODELS.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelItem,
                      selectedModel.id === model.id && styles.modelItemActive,
                    ]}
                    onPress={() => {
                      setSelectedModel(model);
                      setShowModelSelector(false);
                    }}
                  >
                    <View style={styles.modelItemContent}>
                      <Text style={styles.modelItemName}>{model.name}</Text>
                      <Text style={styles.modelItemDesc}>
                        {model.description[language]}
                      </Text>
                      <Text style={styles.modelItemEndpoint}>
                        {model.endpoint}
                      </Text>
                    </View>
                    {selectedModel.id === model.id && (
                      <View style={styles.modelItemCheck}>
                        <Text style={styles.modelItemCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
            <Text style={styles.backText}>← {t("back", language)}</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>
            {t("referenceHairstyle", language)}
          </Text>
          <Text style={styles.screenSubtitle}>
            {t("refSubtitle", language)}
          </Text>

          <View style={styles.colorPickerSection}>
            <Text style={styles.colorPickerLabel}>
              {t("targetHairColor", language)}
            </Text>
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
                    {getColorName(item.id, language)}
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
                      {t("analyzingHairstyle", language)}
                    </Text>
                  </View>
                )}

                {refImageDescription &&
                  !isAnalyzingRef &&
                  !refAnalysisFailed && (
                    <View style={styles.refDescriptionBox}>
                      <Text style={styles.refDescriptionLabel}>
                        {t("aiAnalysis", language)}
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
                      {t("analysisFailedTitle", language)}
                    </Text>
                    <TouchableOpacity
                      style={styles.refRetryButton}
                      onPress={() => {
                        setRefImage(null);
                        setRefAnalysisFailed(false);
                      }}
                    >
                      <Text style={styles.refRetryButtonText}>
                        {t("tryAnotherImage", language)}
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
                    {t("uploadRefImage", language)}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.orDivider}>
                  {t("orPasteUrl", language)}
                </Text>
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
                      <Text style={styles.urlLoadButtonText}>
                        {t("load", language)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                {t("forBestResults", language)}
              </Text>
              <Text style={styles.warningText}>
                • {t("refTip1", language)}
                {"\n"}• {t("refTip2", language)}
                {"\n"}• {t("refTip3", language)}
                {"\n"}• {t("refTip4", language)}
              </Text>
            </View>
          </View>

          {refImage &&
            refImageDescription &&
            !isAnalyzingRef &&
            !refAnalysisFailed && (
              <>
                {/* Model Selector */}
                <TouchableOpacity
                  style={styles.styleModelSelector}
                  onPress={() => setShowModelSelector(true)}
                >
                  <Text style={styles.styleModelLabel}>
                    {t("model", language)}:
                  </Text>
                  <Text style={styles.styleModelName}>
                    {selectedModel.name}
                  </Text>
                  <Text style={styles.styleModelIcon}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateImages}
                >
                  <Text style={styles.generateButtonText}>
                    {t("generatePreview", language)}
                  </Text>
                </TouchableOpacity>
              </>
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

          <Text style={styles.generatingTitle}>
            {t("creatingYourLook", language)}
          </Text>
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
              {t("estimatedTimeRemaining", language)}
            </Text>
            <Text style={styles.timeEstimateValue}>
              ~
              {perceivedSeconds > 0
                ? `${perceivedSeconds}s`
                : t("almostDone", language)}
            </Text>
          </View>

          <View style={styles.funFactBox}>
            <Text style={styles.funFactIcon}>💡</Text>
            <Text style={styles.funFactText}>
              {generationProgress < 30
                ? t("funFact1", language)
                : generationProgress < 60
                ? t("funFact2", language)
                : generationProgress < 90
                ? t("funFact3", language)
                : t("funFact4", language)}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // RESULT SCREEN
  if (screen === "result") {
    // Get all history items for the same hairstyle + original photo (model comparison)
    const currentStyleName =
      flowType === "ref" ? "Reference Style" : selectedStyle;
    const sameStyleResults = historyItems.filter(
      (item) =>
        item.styleName === currentStyleName &&
        item.originalPhotoUri === userPhoto?.uri
    );

    return (
      <SafeAreaView style={styles.resultContainer}>
        <StatusBar style="light" />

        {/* Model Selector Modal */}
        <Modal
          visible={showModelSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModelSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("selectModel", language)}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowModelSelector(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modelList}>
                {SUPPORTED_MODELS.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelItem,
                      selectedModel.id === model.id && styles.modelItemActive,
                    ]}
                    onPress={() => {
                      setSelectedModel(model);
                      setShowModelSelector(false);
                    }}
                  >
                    <View style={styles.modelItemContent}>
                      <Text style={styles.modelItemName}>{model.name}</Text>
                      <Text style={styles.modelItemDesc}>
                        {model.description[language]}
                      </Text>
                      <Text style={styles.modelItemEndpoint}>
                        {model.endpoint}
                      </Text>
                    </View>
                    {selectedModel.id === model.id && (
                      <View style={styles.modelItemCheck}>
                        <Text style={styles.modelItemCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.resultScrollContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{t("yourNewLook", language)}</Text>
            <Text style={styles.resultSubtitle}>{currentStyleName}</Text>
          </View>

          {/* Original Photo */}
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonImageWrapper}>
              <Text style={styles.comparisonLabel}>
                {t("before", language)}
              </Text>
              {userPhoto && (
                <Image
                  source={{ uri: userPhoto.uri }}
                  style={styles.comparisonImageFull}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>

          {/* Model Comparison Section */}
          <View style={styles.modelComparisonSection}>
            <Text style={styles.modelComparisonTitle}>
              {t("generatedResults", language)}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modelComparisonScroll}
            >
              {sameStyleResults.map((item) => (
                <View key={item.id} style={styles.modelResultCard}>
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.modelResultImage}
                    resizeMode="cover"
                  />
                  <View style={styles.modelBadge}>
                    <Text style={styles.modelBadgeText}>
                      {item.modelName || "Unknown"}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            {sameStyleResults.length > 1 && (
              <Text style={styles.modelComparisonHint}>
                {t("swipeToCompare", language)}
              </Text>
            )}
          </View>

          {/* Model Switch Section */}
          <View style={styles.modelSwitchSection}>
            <Text style={styles.modelSwitchLabel}>
              {t("tryWithDifferentModel", language)}
            </Text>
            <TouchableOpacity
              style={styles.modelSwitchButton}
              onPress={() => setShowModelSelector(true)}
            >
              <Text style={styles.modelSwitchButtonText}>
                {selectedModel.name}
              </Text>
              <Text style={styles.modelSwitchButtonIcon}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={generateImages}
              disabled={isGenerating}
            >
              <Text style={styles.regenerateButtonText}>
                {t("generateWithModel", language)}
              </Text>
            </TouchableOpacity>
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
              <Text style={styles.resultActionText}>
                {t("tryAnother", language)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultActionBtn, styles.resultActionBtnPrimary]}
              onPress={resetApp}
            >
              <Text style={styles.resultActionTextPrimary}>
                {t("startOver", language)}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.historyLinkBtn}
            onPress={() => setScreen("history")}
          >
            <Text style={styles.historyLinkText}>
              {t("viewHistory", language)} ({historyItems.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // HISTORY SCREEN
  if (screen === "history") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setScreen("initial")}
            >
              <Text style={styles.backText}>← {t("back", language)}</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitleSmall}>
              {t("myHairstyles", language)}
            </Text>
            {historyItems.length > 0 && (
              <TouchableOpacity
                style={styles.clearHistoryButton}
                onPress={() => {
                  Alert.alert(
                    t("clearAll", language),
                    t("deleteAllHistory", language),
                    [
                      { text: t("cancel", language), style: "cancel" },
                      {
                        text: t("clearAll", language),
                        style: "destructive",
                        onPress: async () => {
                          await clearHistory();
                          setHistoryItems([]);
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.clearHistoryText}>
                  {t("clearAll", language)}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {historyItems.length === 0 ? (
            <View style={styles.historyEmptyState}>
              <Text style={styles.historyEmptyIcon}>📸</Text>
              <Text style={styles.historyEmptyTitle}>
                {t("noHairstylesYet", language)}
              </Text>
              <Text style={styles.historyEmptyText}>
                {t("hairstylesWillAppear", language)}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setScreen("initial")}
              >
                <Text style={styles.primaryButtonText}>
                  {t("createFirstLook", language)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={historyItems}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.historyGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyCard}
                  onPress={() => {
                    setSelectedHistoryItem(item);
                    setScreen("historyDetail");
                  }}
                  onLongPress={() => {
                    Alert.alert(
                      t("delete", language),
                      `"${getHairstyleName(item.styleName, language)}" ${t(
                        "deleteFromHistory",
                        language
                      )}`,
                      [
                        { text: t("cancel", language), style: "cancel" },
                        {
                          text: t("delete", language),
                          style: "destructive",
                          onPress: async () => {
                            await deleteHistoryItem(item.id);
                            setHistoryItems((prev) =>
                              prev.filter((h) => h.id !== item.id)
                            );
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.historyCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.historyCardOverlay}>
                    <Text style={styles.historyCardStyle} numberOfLines={2}>
                      {getHairstyleName(item.styleName, language)}
                    </Text>
                    <Text style={styles.historyCardDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.historyBadgeRow}>
                      {item.modelName && (
                        <View style={styles.historyModelBadge}>
                          <Text style={styles.historyModelBadgeText}>
                            {item.modelName}
                          </Text>
                        </View>
                      )}
                      {item.flowType === "ref" && (
                        <View style={styles.historyRefBadge}>
                          <Text style={styles.historyRefBadgeText}>REF</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // HISTORY DETAIL SCREEN
  if (screen === "historyDetail" && selectedHistoryItem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView style={styles.historyDetailContainer}>
          {/* Header */}
          <View style={styles.historyHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedHistoryItem(null);
                setScreen("history");
              }}
            >
              <Text style={styles.backText}>← {t("back", language)}</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitleSmall}>
              {getHairstyleName(selectedHistoryItem.styleName, language)}
            </Text>
          </View>

          {/* Before/After Comparison */}
          <View style={styles.historyComparisonSection}>
            {/* Original Selfie */}
            <View style={styles.historyComparisonItem}>
              <Text style={styles.historyComparisonLabel}>
                {t("before", language)}
              </Text>
              {selectedHistoryItem.originalPhotoUri ? (
                <Image
                  source={{ uri: selectedHistoryItem.originalPhotoUri }}
                  style={styles.historyComparisonImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.historyNoOriginal}>
                  <Text style={styles.historyNoOriginalText}>📷</Text>
                </View>
              )}
            </View>

            {/* Arrow */}
            <View style={styles.historyComparisonArrow}>
              <Text style={styles.historyComparisonArrowText}>↓</Text>
            </View>

            {/* Generated Image */}
            <View style={styles.historyComparisonItem}>
              <Text style={styles.historyComparisonLabel}>
                {t("after", language)}
              </Text>
              <Image
                source={{ uri: selectedHistoryItem.imageUri }}
                style={styles.historyComparisonImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Details */}
          <View style={styles.historyDetailInfo}>
            <Text style={styles.historyDetailLabel}>
              {t("style", language)}
            </Text>
            <Text style={styles.historyDetailValue}>
              {getHairstyleName(selectedHistoryItem.styleName, language)}
            </Text>

            <Text style={styles.historyDetailLabel}>{t("date", language)}</Text>
            <Text style={styles.historyDetailValue}>
              {new Date(selectedHistoryItem.createdAt).toLocaleString()}
            </Text>

            <Text style={styles.historyDetailLabel}>{t("type", language)}</Text>
            <Text style={styles.historyDetailValue}>
              {selectedHistoryItem.flowType === "ref"
                ? t("referenceImage", language)
                : t("styleSelection", language)}
            </Text>

            {selectedHistoryItem.modelName && (
              <>
                <Text style={styles.historyDetailLabel}>
                  {t("model", language)}
                </Text>
                <Text style={styles.historyDetailValue}>
                  {selectedHistoryItem.modelName}
                </Text>
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.historyDetailActions}>
            <TouchableOpacity
              style={[styles.resultActionBtn, styles.resultActionBtnPrimary]}
              onPress={() => {
                Alert.alert(
                  t("delete", language),
                  t("deleteAllHistory", language),
                  [
                    { text: t("cancel", language), style: "cancel" },
                    {
                      text: t("delete", language),
                      style: "destructive",
                      onPress: async () => {
                        await deleteHistoryItem(selectedHistoryItem.id);
                        setHistoryItems((prev) =>
                          prev.filter((h) => h.id !== selectedHistoryItem.id)
                        );
                        setSelectedHistoryItem(null);
                        setScreen("history");
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.resultActionText}>
                🗑️ {t("delete", language)}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },

  // Language Toggle
  languageToggle: {
    position: "absolute",
    top: 16,
    right: 24,
    backgroundColor: "#252530",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  languageToggleText: {
    color: "#7c5cff",
    fontSize: 14,
    fontWeight: "700",
  },

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
  photoCaptureContent: { flex: 1, padding: 24, paddingTop: 50 },
  backButton: { marginBottom: 16, paddingVertical: 8 },
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
  stylesGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 10 },
  styleCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleCardActive: { borderColor: "#7c5cff", backgroundColor: "#1f1a30" },
  stylePreviewPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#252530",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  stylePreviewImage: {
    width: "100%",
    height: "100%",
  },
  stylePreviewIcon: { fontSize: 32, opacity: 0.5 },
  styleCardTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  styleCardTitleActive: { color: "#fff" },
  styleCardDescription: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    lineHeight: 15,
  },
  styleCardDescriptionActive: { color: "#aaa" },
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
  selectedStyleSection: {
    backgroundColor: "#1a1a24",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    maxHeight: 280,
  },
  selectedStyleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#252530",
    paddingBottom: 10,
    position: "relative",
  },
  selectedStyleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7c5cff",
    textAlign: "center",
    flex: 1,
  },
  selectedStyleCloseBtn: {
    position: "absolute",
    right: 0,
    top: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#252530",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedStyleCloseText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedStyleDescScroll: {
    maxHeight: 120,
    marginBottom: 12,
  },
  selectedStyleDesc: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 22,
  },
  // Style panel model selector
  styleModelSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252530",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  styleModelLabel: {
    color: "#888",
    fontSize: 13,
    marginRight: 8,
  },
  styleModelName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  styleModelIcon: {
    color: "#7c5cff",
    fontSize: 12,
  },
  generateButton: {
    backgroundColor: "#7c5cff",
    paddingVertical: 16,
    borderRadius: 14,
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
  resultScrollContent: { paddingBottom: 32 },
  resultHeader: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a24",
  },
  resultTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  resultSubtitle: {
    fontSize: 14,
    color: "#7c5cff",
    marginTop: 4,
    fontWeight: "600",
  },
  comparisonContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  comparisonImageWrapper: {
    width: "100%",
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
  comparisonImageFull: { width: "100%", aspectRatio: 3 / 4 },
  comparisonDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#252530" },
  dividerIcon: { fontSize: 20, color: "#7c5cff", marginHorizontal: 12 },
  // Model comparison styles
  modelComparisonSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modelComparisonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  modelComparisonScroll: {
    gap: 12,
    paddingRight: 16,
  },
  modelResultCard: {
    width: SCREEN_WIDTH - 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a24",
    position: "relative",
  },
  modelResultImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  modelBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(124, 92, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modelBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  modelComparisonHint: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    marginTop: 8,
  },
  // Model switch section styles
  modelSwitchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a24",
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modelSwitchLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  modelSwitchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#252530",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  modelSwitchButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  modelSwitchButtonIcon: {
    color: "#7c5cff",
    fontSize: 12,
  },
  regenerateButton: {
    backgroundColor: "#7c5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  regenerateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
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

  // History Link on Result Screen
  historyLinkBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  historyLinkText: {
    color: "#7c5cff",
    fontSize: 15,
    fontWeight: "600",
  },

  // History Button on Initial Screen
  historyButtonInitial: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(124, 92, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 255, 0.3)",
  },
  historyButtonInitialText: {
    color: "#7c5cff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Model Selector Button
  modelSelectorButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#252530",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modelSelectorLabel: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  modelSelectorValue: {
    color: "#7c5cff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Settings Toggle Button
  settingsToggleButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#252530",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsToggleContent: {
    flex: 1,
  },
  settingsToggleLabel: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  settingsToggleDesc: {
    color: "#555",
    fontSize: 11,
    marginTop: 2,
  },
  settingsToggleSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#333",
    minWidth: 50,
    alignItems: "center",
  },
  settingsToggleSwitchOn: {
    backgroundColor: "#7c5cff",
  },
  settingsToggleSwitchText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // Model Selector Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a24",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#252530",
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  modalCloseBtn: {
    position: "absolute",
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#252530",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: "#888",
    fontSize: 16,
  },
  modelList: {
    padding: 16,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252530",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  modelItemActive: {
    borderColor: "#7c5cff",
    backgroundColor: "#1f1a30",
  },
  modelItemContent: {
    flex: 1,
  },
  modelItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  modelItemDesc: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  modelItemEndpoint: {
    fontSize: 11,
    color: "#555",
    fontFamily: "monospace",
  },
  modelItemCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7c5cff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  modelItemCheckText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // History Screen
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a24",
  },
  clearHistoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearHistoryText: {
    color: "#ff4444",
    fontSize: 14,
    fontWeight: "500",
  },
  historyGrid: {
    padding: 12,
  },
  historyCard: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a24",
    maxWidth: (SCREEN_WIDTH - 48) / 2,
  },
  historyCardImage: {
    width: "100%",
    aspectRatio: 0.75,
  },
  historyCardOverlay: {
    padding: 12,
  },
  historyCardStyle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  historyCardDate: {
    fontSize: 11,
    color: "#666",
  },
  historyBadgeRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
  },
  historyModelBadge: {
    backgroundColor: "rgba(124, 92, 255, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyModelBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "600",
  },
  historyRefBadge: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyRefBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
  },
  historyEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  historyEmptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  historyEmptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  historyEmptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },

  // History Detail Screen
  historyDetailContainer: {
    flex: 1,
  },

  // History Comparison Section
  historyComparisonSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#1a1a24",
    borderRadius: 20,
    padding: 16,
  },
  historyComparisonItem: {
    alignItems: "center",
  },
  historyComparisonLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7c5cff",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  historyComparisonImage: {
    width: SCREEN_WIDTH - 64,
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: "#252530",
  },
  historyComparisonArrow: {
    alignItems: "center",
    paddingVertical: 8,
  },
  historyComparisonArrowText: {
    fontSize: 24,
    color: "#555",
  },
  historyNoOriginal: {
    width: SCREEN_WIDTH - 64,
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: "#252530",
    alignItems: "center",
    justifyContent: "center",
  },
  historyNoOriginalText: {
    fontSize: 48,
    opacity: 0.3,
  },

  historyDetailImageContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a24",
  },
  historyDetailImage: {
    width: "100%",
    aspectRatio: 0.8,
  },
  historyDetailInfo: {
    padding: 20,
    marginHorizontal: 12,
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    marginTop: 8,
  },
  historyDetailLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginTop: 12,
  },
  historyDetailValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginTop: 4,
  },
  historyDetailActions: {
    padding: 16,
    marginTop: 8,
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
