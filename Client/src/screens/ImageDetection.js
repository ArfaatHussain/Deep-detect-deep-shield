import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ThemeContext } from '../context/ThemeContext';
import Toast from 'react-native-simple-toast';
import { detectImage } from '../service/imageApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ImageDetection = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const { darkTheme } = useContext(ThemeContext);

  const showToast = (message) => {
    Toast.show(message, Toast.SHORT);
  };

  const selectImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showToast('We need access to your gallery to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: false,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      setSelectedImage({
        uri: image.uri,
        type: 'image/jpeg',
        fileName: 'image.jpg',
      });
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      showToast('Please select an image first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Retrieve the logged-in user from AsyncStorage
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        showToast('User is not logged in');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      const ownerId = user._id; // Make sure this matches the backend expected field

      // Send the image and ownerId to the backend
      const data = await detectImage(selectedImage, ownerId);

      setResult({
        classification: data.class || 'Unknown',
        confidence: (data.confidenceScore * 100).toFixed(1),
        explanation: data.explanation || 'No explanation provided',
        analyzedImage: data.resultImage || null,
      });
    } catch (error) {
      console.error('Analyze error:', error.response?.data || error.message);
      showToast('Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!result?.analyzedImage) {
      showToast("No image available to download");
      return;
    }

    setDownloadLoading(true);

    try {
      const timestamp = new Date().getTime();
      const filename = `deepfake-analyzed-${timestamp}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Download image to app storage (no permission required)
      const downloadResult = await FileSystem.downloadAsync(result.analyzedImage, fileUri);

      // Confirm that file exists
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      if (!fileInfo.exists) throw new Error("Download failed");

      showToast("Image saved successfully]!");
      console.log("File saved at:", downloadResult.uri);
    } catch (error) {
      console.error("Download error:", error.message);
      showToast("Failed to save image");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: darkTheme ? '#0F172A' : '#F9FAFB' },
      ]}>
      {/* Back Button */}
      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: darkTheme ? 'rgba(30,41,59,0.8)' : '#E2E8F0' },
        ]}
        onPress={() => navigation.goBack()}>
        <Icon
          name="arrow-back"
          size={24}
          color={darkTheme ? '#F1F5F9' : '#1E293B'}
        />
      </TouchableOpacity>

      <Text
        style={[styles.title, { color: darkTheme ? '#F1F5F9' : '#1E293B' }]}>
        Image Detection
      </Text>

      {/* Upload */}
      <TouchableOpacity
        style={[
          styles.uploadArea,
          {
            backgroundColor: darkTheme ? '#1E293B' : '#E2E8F0',
            borderColor: darkTheme ? '#334155' : '#CBD5E1',
          },
        ]}
        onPress={selectImage}>
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.imagePreview}
            resizeMode="contain"
            onError={() => showToast('Failed to load image')}
          />
        ) : (
          <>
            <Icon
              name="cloud-upload-outline"
              size={50}
              color={darkTheme ? '#64748B' : '#475569'}
            />
            <Text
              style={[
                styles.uploadText,
                { color: darkTheme ? '#F1F5F9' : '#1E293B' },
              ]}>
              Select an Image
            </Text>
            <Text
              style={[
                styles.uploadSubtext,
                { color: darkTheme ? '#94A3B8' : '#475569' },
              ]}>
              Tap to choose from gallery
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.detectButton,
          (!selectedImage || loading) && styles.buttonDisabled,
        ]}
        onPress={analyzeImage}
        disabled={!selectedImage || loading}>
        {loading ? (
          <ActivityIndicator color="#F1F5F9" />
        ) : (
          <Text style={styles.detectButtonText}>Detect Deepfake</Text>
        )}
      </TouchableOpacity>

      {/* Results */}
      {result && (
        <>
          <View
            style={[
              styles.resultContainer,
              result.classification.toLowerCase().includes("fake")
                ? styles.resultFake
                : styles.resultReal,
            ]}>
            <Icon
              name={
                result.classification.toLowerCase().includes("fake")
                  ? 'warning-outline'
                  : 'checkmark-circle-outline'
              }
              size={40}
              color={
                result.classification.toLowerCase().includes("fake")
                  ? '#EF4444'
                  : '#10B981'
              }
            />
            <Text style={styles.resultTitle}>
              Classification: {result.classification}
            </Text>
            <Text style={styles.resultConfidence}>
              Confidence Score: {result.confidence}%
            </Text>
            <Text style={styles.resultDetails}>{result.explanation}</Text>
          </View>

          {result.analyzedImage && result.classification.toLowerCase().includes("fake") && (
            <View
              style={[
                styles.highlightContainer,
                {
                  backgroundColor: darkTheme ? '#1E293B' : '#E2E8F0',
                  borderColor: darkTheme ? '#334155' : '#CBD5E1',
                },
              ]}>
              <Text
                style={[
                  styles.infoTitle,
                  { color: darkTheme ? '#F1F5F9' : '#1E293B' },
                ]}>
                Analyzed Image
              </Text>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: result.analyzedImage }}
                  style={styles.highlightedImage}
                  resizeMode="contain"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.detectButton,
                  { backgroundColor: "#EF4444", marginTop: 16 },
                  downloadLoading && styles.buttonDisabled
                ]}
                onPress={downloadImage}
                disabled={downloadLoading}
              >
                {downloadLoading ? (
                  <View style={styles.downloadButtonContent}>
                    <ActivityIndicator color="#F1F5F9" size="small" />
                    <Text style={styles.detectButtonText}>Downloading...</Text>
                  </View>
                ) : (
                  <Text style={styles.detectButtonText}>Download Analyzed Image</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Info Section */}
      <View
        style={[
          styles.infoContainer,
          {
            backgroundColor: darkTheme ? '#1E293B' : '#E2E8F0',
            borderColor: darkTheme ? '#334155' : '#CBD5E1',
          },
        ]}>
        <Text
          style={[
            styles.infoTitle,
            { color: darkTheme ? '#F1F5F9' : '#1E293B' },
          ]}>
          How it works:
        </Text>
        <Text
          style={[
            styles.infoText,
            { color: darkTheme ? '#94A3B8' : '#475569' },
          ]}>
          • Analyzes facial inconsistencies{'\n'}• Checks for digital artifacts
          {'\n'}• Examines lighting and shadows{'\n'}• Verifies image metadata
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, marginTop: 85 },
  uploadArea: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  uploadText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  uploadSubtext: { fontSize: 14, marginTop: 8 },
  imagePreview: { width: '100%', height: 250, borderRadius: 12, marginBottom: 12 },
  detectButton: { backgroundColor: '#2563EB', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  buttonDisabled: { backgroundColor: '#475569' },
  detectButtonText: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  resultContainer: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1 },
  resultReal: { backgroundColor: '#064E3B', borderColor: '#10B981' },
  resultFake: { backgroundColor: '#7F1D1D', borderColor: '#EF4444' },
  resultTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 12, color: '#F1F5F9' },
  resultConfidence: { fontSize: 16, marginTop: 8, fontWeight: '600', color: '#F1F5F9' },
  resultDetails: { fontSize: 14, marginTop: 12, textAlign: 'center', color: '#E2E8F0' },
  infoContainer: { padding: 20, marginBottom: 60, borderRadius: 16, borderWidth: 1 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoText: { fontSize: 14, lineHeight: 22 },
  highlightContainer: { padding: 20, marginBottom: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  imageWrapper: { width: '100%', height: 250, marginTop: 12 },
  highlightedImage: { width: '100%', height: '100%', borderRadius: 12 },
  downloadButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

export default ImageDetection;
