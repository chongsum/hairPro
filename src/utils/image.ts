import * as ImageManipulator from "expo-image-manipulator";

/**
 * Resize and compress image to ~1024px max dimension and reduce quality
 */
export const resizeAndCompressImage = async (
  uri: string
): Promise<{ uri: string; base64: string }> => {
  try {
    console.log("Resizing and compressing image...");

    // Resize to max 1024px on longest side and compress to 30% quality
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      {
        compress: 0.3,
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
    return { uri, base64: "" };
  }
};

