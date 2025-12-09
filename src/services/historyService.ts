import * as FileSystem from "expo-file-system/legacy";

// Directory for storing history data
const HISTORY_DIR = `${FileSystem.documentDirectory}history/`;
const HISTORY_JSON = `${HISTORY_DIR}history.json`;

export interface HistoryItem {
  id: string;
  styleName: string;
  imageUri: string;
  originalPhotoUri: string;
  gender: string;
  color: string;
  flowType: "style" | "ref";
  refImageUri?: string;
  modelId?: string; // Which AI model was used
  modelName?: string; // Display name of the model
  createdAt: number;
}

/**
 * Ensure the history directory exists
 */
const ensureHistoryDir = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(HISTORY_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(HISTORY_DIR, { intermediates: true });
  }
};

/**
 * Load history from storage
 */
export const loadHistory = async (): Promise<HistoryItem[]> => {
  try {
    await ensureHistoryDir();
    const fileInfo = await FileSystem.getInfoAsync(HISTORY_JSON);
    if (!fileInfo.exists) {
      return [];
    }
    const content = await FileSystem.readAsStringAsync(HISTORY_JSON);
    const history = JSON.parse(content) as HistoryItem[];
    // Sort by most recent first
    return history.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error loading history:", error);
    return [];
  }
};

/**
 * Save a generated hairstyle to history
 */
export const saveToHistory = async (
  generatedImageUrl: string,
  originalPhotoUri: string,
  styleName: string,
  gender: string,
  color: string,
  flowType: "style" | "ref",
  refImageUri?: string,
  modelId?: string,
  modelName?: string
): Promise<HistoryItem> => {
  try {
    await ensureHistoryDir();

    // Generate unique ID
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const localImagePath = `${HISTORY_DIR}${id}.jpg`;

    // Download/save the generated image
    if (generatedImageUrl.startsWith("data:")) {
      const base64Data = generatedImageUrl.split(",")[1];
      await FileSystem.writeAsStringAsync(localImagePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else {
      const downloadResult = await FileSystem.downloadAsync(
        generatedImageUrl,
        localImagePath
      );
      if (downloadResult.status !== 200) {
        throw new Error("Failed to download image");
      }
    }

    // Create history item
    const historyItem: HistoryItem = {
      id,
      styleName,
      imageUri: localImagePath,
      originalPhotoUri,
      gender,
      color,
      flowType,
      refImageUri,
      modelId,
      modelName,
      createdAt: Date.now(),
    };

    // Load existing history and add new item
    const history = await loadHistory();
    history.unshift(historyItem);

    // Save updated history
    await FileSystem.writeAsStringAsync(HISTORY_JSON, JSON.stringify(history));

    console.log(`✓ Saved to history: ${styleName}`);
    return historyItem;
  } catch (error: any) {
    console.error("Error saving to history:", error);
    throw new Error(`Failed to save to history: ${error.message}`);
  }
};

/**
 * Delete a history item
 */
export const deleteHistoryItem = async (id: string): Promise<void> => {
  try {
    const history = await loadHistory();
    const item = history.find((h) => h.id === id);

    if (item) {
      // Delete the image file
      const fileInfo = await FileSystem.getInfoAsync(item.imageUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(item.imageUri);
      }
    }

    // Remove from history array
    const updatedHistory = history.filter((h) => h.id !== id);
    await FileSystem.writeAsStringAsync(
      HISTORY_JSON,
      JSON.stringify(updatedHistory)
    );

    console.log(`✓ Deleted from history: ${id}`);
  } catch (error) {
    console.error("Error deleting history item:", error);
  }
};

/**
 * Clear all history
 */
export const clearHistory = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(HISTORY_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(HISTORY_DIR, { idempotent: true });
    }
    console.log("✓ History cleared");
  } catch (error) {
    console.error("Error clearing history:", error);
  }
};

