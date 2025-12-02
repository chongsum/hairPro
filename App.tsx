import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { analyzeHair, assessStyleFeasibility, generateHairstyle, HairAnalysis, StyleAssessment } from './src/services/openrouter';

type Screen = 'home' | 'analyze' | 'result';
type Gender = 'male' | 'female';

const TRENDY_STYLES = {
  male: [
    'Textured Crop',
    'Buzz Cut Fade',
    'Slicked Back Undercut',
    'Messy Quiff',
    'Modern Pompadour',
    'Curtain Bangs',
  ],
  female: [
    'Layered Bob',
    'Beach Waves',
    'Sleek Straight',
    'Curtain Bangs',
    'Pixie Cut',
    'Long Layers with Face Frame',
  ],
};

import { Asset } from 'expo-asset';
import { DEMO_IMAGE } from './src/demoImage';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>('female');
  const [targetStyle, setTargetStyle] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysis | null>(null);
  const [styleAssessment, setStyleAssessment] = useState<StyleAssessment | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      console.log('Requesting media library permission...');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permission);
      
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photo library');
        return;
      }

      console.log('Launching image picker...');
      // Disable all processing options to avoid simulator bugs
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        base64: false, // Don't ask picker for base64
        exif: false,
      });

      console.log('Picker result:', result.canceled ? 'canceled' : 'got image');

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        console.log('Asset URI:', uri);
        setImageUri(uri);
        
        // Robust method: Use fetch to get blob, then FileReader to get base64
        // This bypasses expo-file-system bugs on simulator
        try {
          console.log('Fetching image blob...');
          const response = await fetch(uri);
          const blob = await response.blob();
          
          console.log('Reading blob as base64...');
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/jpeg;base64, prefix
            const base64 = result.split(',')[1];
            console.log('Base64 generated, length:', base64.length);
            setImageBase64(base64);
            setScreen('analyze');
          };
          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            Alert.alert('Error', 'Failed to process image');
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error('Fetch/Blob failed:', e);
          // Last resort fallback: just assume it works without base64 for UI preview
          // but AI calls will fail.
          Alert.alert('Error', 'Failed to process image data. Try a different photo.');
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('Requesting camera permission...');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Permission result:', permission);
      
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your camera');
        return;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      console.log('Camera result:', result.canceled ? 'canceled' : 'got image');

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Asset URI:', asset.uri);
        console.log('Has base64:', !!asset.base64);
        
        setImageUri(asset.uri);
        
        if (asset.base64) {
          setImageBase64(asset.base64);
          setScreen('analyze');
        } else {
          try {
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            setImageBase64(base64);
            setScreen('analyze');
          } catch (e) {
            console.error('File read failed:', e);
            Alert.alert('Error', 'Could not process image. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  const runAnalysis = async () => {
    if (!imageBase64) return;
    
    setLoading(true);
    setLoadingMessage('Analyzing your hair...');
    
    try {
      const analysis = await analyzeHair(imageBase64);
      setHairAnalysis(analysis);
      Alert.alert('Analysis Complete!', `Texture: ${analysis.texture}\nDensity: ${analysis.density}\nCondition: ${analysis.condition}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze hair');
    } finally {
      setLoading(false);
    }
  };

  const generateNewStyle = async () => {
    if (!imageBase64 || !hairAnalysis) {
      Alert.alert('Please analyze your hair first');
      return;
    }

    const style = customStyle || targetStyle;
    if (!style) {
      Alert.alert('Please select or enter a hairstyle');
      return;
    }

    setLoading(true);
    
    try {
      // First assess feasibility
      setLoadingMessage('Assessing style feasibility...');
      const assessment = await assessStyleFeasibility(imageBase64, style, gender, hairAnalysis);
      setStyleAssessment(assessment);

      // Then generate the image
      setLoadingMessage('Generating your new look...');
      const result = await generateHairstyle(imageBase64, style, gender, hairAnalysis);
      setGeneratedImage(result);
      setScreen('result');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate hairstyle');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScreen('home');
    setImageUri(null);
    setImageBase64(null);
    setHairAnalysis(null);
    setStyleAssessment(null);
    setGeneratedImage(null);
    setTargetStyle('');
    setCustomStyle('');
  };

  // Add this demo image function
  const useDemoImage = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading demo photo...');
      
      // Use embedded base64 directly - 100% reliable
      const base64 = DEMO_IMAGE;
      
      // Setup URI for display (needs data prefix)
      setImageUri(`data:image/jpeg;base64,${base64}`);
      setImageBase64(base64);
      
      setLoading(false);
      setScreen('analyze');
      
    } catch (error) {
      console.error('Demo image failed:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load demo image');
    }
  };

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.heroSection}>
          <Text style={styles.logo}>✂️</Text>
          <Text style={styles.title}>HairPro</Text>
          <Text style={styles.subtitle}>AI-Powered Hairstyle Preview</Text>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Take Selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonTextDark}>Upload Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, { marginTop: 10, backgroundColor: '#252540' }]} onPress={useDemoImage}>
            <Text style={styles.buttonIcon}>🧪</Text>
            <Text style={[styles.buttonText, { color: '#fff' }]}>Use Demo Photo (Test AI)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          See yourself with a new hairstyle before committing!
        </Text>
      </SafeAreaView>
    );
  }

  // ANALYZE SCREEN
  if (screen === 'analyze') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={reset}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}

          {/* Gender Selection */}
          <Text style={styles.sectionTitle}>Select Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'female' && styles.genderActive]}
              onPress={() => setGender('female')}
            >
              <Text style={styles.genderText}>👩 Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'male' && styles.genderActive]}
              onPress={() => setGender('male')}
            >
              <Text style={styles.genderText}>👨 Male</Text>
            </TouchableOpacity>
          </View>

          {/* Hair Analysis */}
          {!hairAnalysis ? (
            <TouchableOpacity 
              style={styles.analyzeButton} 
              onPress={runAnalysis}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>🔍 Analyze My Hair</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.analysisCard}>
              <Text style={styles.cardTitle}>Hair Analysis</Text>
              <Text style={styles.analysisItem}>Texture: {hairAnalysis.texture}</Text>
              <Text style={styles.analysisItem}>Density: {hairAnalysis.density}</Text>
              <Text style={styles.analysisItem}>Condition: {hairAnalysis.condition}</Text>
              <Text style={styles.analysisItem}>Photo Quality: {hairAnalysis.realism_score}/10</Text>
              <Text style={styles.observations}>{hairAnalysis.observations}</Text>
            </View>
          )}

          {/* Style Selection */}
          {hairAnalysis && (
            <>
              <Text style={styles.sectionTitle}>Choose a Style</Text>
              <View style={styles.stylesGrid}>
                {TRENDY_STYLES[gender].map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[styles.styleChip, targetStyle === style && styles.styleChipActive]}
                    onPress={() => {
                      setTargetStyle(style);
                      setCustomStyle('');
                    }}
                  >
                    <Text style={[styles.styleChipText, targetStyle === style && styles.styleChipTextActive]}>
                      {style}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.orText}>— OR —</Text>

              <TextInput
                style={styles.customInput}
                placeholder="Describe your dream hairstyle..."
                placeholderTextColor="#888"
                value={customStyle}
                onChangeText={(text) => {
                  setCustomStyle(text);
                  setTargetStyle('');
                }}
              />

              <TouchableOpacity 
                style={styles.generateButton} 
                onPress={generateNewStyle}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>✨ Generate New Look</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RESULT SCREEN
  if (screen === 'result') {
    // Check if it's a valid image URL/Data URI
    const isImageResult = generatedImage && (
      generatedImage.startsWith('data:image') || 
      generatedImage.startsWith('http')
    );
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultTitle}>Your New Look</Text>

          {isImageResult ? (
            <Image 
              source={{ uri: generatedImage! }} 
              style={styles.resultImage} 
              resizeMode="contain"
            />
          ) : (
            <View style={styles.textResultCard}>
              <Text style={styles.cardTitle}>⚠️ No Image Generated</Text>
              <Text style={styles.textResult}>
                {generatedImage || "The AI did not return an image result."}
              </Text>
              <Text style={styles.observations}>
                Note: Some AI models may only provide text descriptions if the image generation fails or is filtered.
              </Text>
            </View>
          )}

          {styleAssessment && (
            <View style={styles.assessmentCard}>
              <Text style={styles.cardTitle}>
                {styleAssessment.is_realistic ? '✅ Achievable!' : '⚠️ Challenging'}
              </Text>
              <Text style={styles.scoreText}>
                Feasibility Score: {styleAssessment.realism_score}/10
              </Text>
              <Text style={styles.reasoning}>{styleAssessment.reasoning}</Text>

              {styleAssessment.required_treatments.length > 0 && (
                <>
                  <Text style={styles.listTitle}>Required Treatments:</Text>
                  {styleAssessment.required_treatments.map((t, i) => (
                    <Text key={i} style={styles.listItem}>• {t}</Text>
                  ))}
                </>
              )}

              {styleAssessment.recommended_products.length > 0 && (
                <>
                  <Text style={styles.listTitle}>Recommended Products:</Text>
                  {styleAssessment.recommended_products.map((p, i) => (
                    <Text key={i} style={styles.listItem}>• {p}</Text>
                  ))}
                </>
              )}

              <Text style={styles.timeEstimate}>
                ⏱️ {styleAssessment.estimated_time}
              </Text>

              {!styleAssessment.is_realistic && styleAssessment.alternatives && (
                <>
                  <Text style={styles.listTitle}>Alternative Styles:</Text>
                  {styleAssessment.alternatives.map((a, i) => (
                    <Text key={i} style={styles.listItem}>• {a}</Text>
                  ))}
                </>
              )}
            </View>
          )}

          <View style={styles.resultButtons}>
            <TouchableOpacity style={styles.tryAgainButton} onPress={() => setScreen('analyze')}>
              <Text style={styles.buttonTextDark}>Try Another Style</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newPhotoButton} onPress={reset}>
              <Text style={styles.buttonText}>New Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  buttonSection: {
    padding: 20,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#0f0f1a',
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    color: '#666',
    textAlign: 'center',
    paddingBottom: 30,
    fontSize: 14,
  },
  backButton: {
    marginBottom: 15,
  },
  backText: {
    color: '#6c5ce7',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderActive: {
    borderColor: '#6c5ce7',
    backgroundColor: '#252540',
  },
  genderText: {
    color: '#fff',
    fontSize: 16,
  },
  analyzeButton: {
    backgroundColor: '#00b894',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  analysisItem: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 6,
  },
  observations: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  styleChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  styleChipActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  styleChipText: {
    color: '#ccc',
    fontSize: 14,
  },
  styleChipTextActive: {
    color: '#fff',
  },
  orText: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 15,
  },
  customInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  generateButton: {
    backgroundColor: '#e84393',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    marginBottom: 20,
  },
  textResultCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  textResult: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
  },
  assessmentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  scoreText: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  reasoning: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  listTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  listItem: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 10,
    marginBottom: 4,
  },
  timeEstimate: {
    color: '#00b894',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 15,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tryAgainButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newPhotoButton: {
    flex: 1,
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
