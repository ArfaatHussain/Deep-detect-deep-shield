import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../context/ThemeContext';
import Toast from 'react-native-simple-toast';

const ImageDetection = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { darkTheme } = useContext(ThemeContext);

  const showToast = (message) => {
    Toast.show(message, Toast.SHORT);
  };

  const selectImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showToast('We need access to your gallery to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      const isFake = Math.random() > 0.5;
      setResult({
        isFake,
        confidence: (Math.random() * 30 + 70).toFixed(1),
        details: isFake
          ? 'This image shows signs of manipulation'
          : 'This image appears to be authentic',
      });
    }, 3000);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: darkTheme ? '#0F172A' : '#F9FAFB' },
      ]}>
      {/* Back Icon */}
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
        Image Deepfake Detection
      </Text>

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
            onError={() => Alert.alert('Error', 'Failed to load image')}
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

      {result && (
        <View
          style={[
            styles.resultContainer,
            result.isFake ? styles.resultFake : styles.resultReal,
          ]}>
          <Icon
            name={
              result.isFake ? 'warning-outline' : 'checkmark-circle-outline'
            }
            size={40}
            color={result.isFake ? '#EF4444' : '#10B981'}
          />
          <Text style={styles.resultTitle}>
            {result.isFake ? 'Potential Deepfake Detected' : 'Authentic Image'}
          </Text>
          <Text style={styles.resultConfidence}>
            Confidence: {result.confidence}%
          </Text>
          <Text style={styles.resultDetails}>{result.details}</Text>
        </View>
      )}

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
    top: 25,
    left: 10,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 78,
    letterSpacing: 0.5,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    letterSpacing: 0.3,
  },
  uploadSubtext: { fontSize: 14, marginTop: 8, letterSpacing: 0.3 },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },
  detectButton: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { backgroundColor: '#475569' },
  detectButtonText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resultReal: { backgroundColor: '#064E3B', borderColor: '#10B981' },
  resultFake: { backgroundColor: '#7F1D1D', borderColor: '#EF4444' },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
    color: '#F1F5F9',
    letterSpacing: 0.3,
  },
  resultConfidence: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  resultDetails: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    color: '#E2E8F0',
    lineHeight: 20,
  },
  infoContainer: {
    padding: 20,
    marginBottom: 60,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  infoText: { fontSize: 14, lineHeight: 22, letterSpacing: 0.3 },
});

export default ImageDetection;
