import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { ThemeContext } from '../context/ThemeContext';
import Toast from 'react-native-simple-toast';
import { getTheme } from '../context/theme';

const VideoDetection = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const t = getTheme(darkTheme);

  const showToast = (message) => {
    Toast.show(message, Toast.SHORT);
  };

  const selectVideo = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showToast('We need access to your gallery to select a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const video = result.assets[0];
      setSelectedVideo({
        uri: video.uri,
        type: 'video/mp4',
        fileName: 'video.mp4',
      });
      setResult(null);
    }
  };

  const analyzeVideo = async () => {
    if (!selectedVideo) {
      showToast('Please select a video first');
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
          ? 'This video shows signs of manipulation'
          : 'This video appears to be authentic',
      });
    }, 4000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]}>
      {/* Back Icon */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: t.cardBg }]}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={t.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: t.textPrimary }]}>
        Video Detection
      </Text>

      {/* Upload Area */}
      <TouchableOpacity
        style={[styles.uploadArea, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
        onPress={selectVideo}>
        {selectedVideo ? (
          <Video
            source={{ uri: selectedVideo.uri }}
            style={styles.videoPreview}
            useNativeControls
            resizeMode="contain"
            onError={() => Alert.alert('Error', 'Failed to load video')}
          />
        ) : (
          <>
            <Icon name="videocam-outline" size={50} color={t.uploadIcon} />
            <Text style={[styles.uploadText, { color: t.textPrimary }]}>Select a Video</Text>
            <Text style={[styles.uploadSubtext, { color: t.textSecondary }]}>Tap to choose from gallery</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Detect Button */}
      <TouchableOpacity
        style={[
          styles.detectButton,
          (!selectedVideo || loading) && { backgroundColor: t.detectButtonDisabled },
        ]}
        onPress={analyzeVideo}
        disabled={!selectedVideo || loading}>
        {loading ? <ActivityIndicator color="#F1F5F9" /> : <Text style={styles.detectButtonText}>Detect Deepfake</Text>}
      </TouchableOpacity>

      {/* Result */}
      {result && (
        <View
          style={[
            styles.resultContainer,
            result.isFake
              ? { backgroundColor: t.resultFakeBg, borderColor: t.resultFakeBorder }
              : { backgroundColor: t.resultRealBg, borderColor: t.resultRealBorder },
          ]}>
          <Icon
            name={result.isFake ? 'warning-outline' : 'checkmark-circle-outline'}
            size={40}
            color={result.isFake ? '#EF4444' : '#10B981'}
          />
          <Text style={styles.resultTitle}>
            {result.isFake ? 'Potential Deepfake Detected' : 'Authentic Video'}
          </Text>
          <Text style={styles.resultConfidence}>
            Confidence: {result.confidence}%
          </Text>
          <Text style={styles.resultDetails}>{result.details}</Text>
        </View>
      )}

      {/* Info Section */}
      <View style={[styles.infoContainer, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <Text style={[styles.infoTitle, { color: t.textPrimary }]}>How it works:</Text>
        <Text style={[styles.infoText, { color: t.textSecondary }]}>
          • Detects frame inconsistencies{'\n'}
          • Analyzes audio-visual sync{'\n'}
          • Checks for compression artifacts{'\n'}
          • Examines metadata
        </Text>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backButton: { position: 'absolute', top: 10, left: 10, zIndex: 10, padding: 10, borderRadius: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, marginTop: 85, letterSpacing: 0.5 },
  uploadArea: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#020617', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  uploadText: { fontSize: 18, fontWeight: '600', marginTop: 16, letterSpacing: 0.3 },
  uploadSubtext: { fontSize: 14, marginTop: 8, letterSpacing: 0.3 },
  videoPreview: { width: '100%', height: 250, borderRadius: 12, marginBottom: 12 },
  detectButton: { backgroundColor: '#2563EB', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 24, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  detectButtonText: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  resultContainer: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, shadowColor: '#020617', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 12, textAlign: 'center', color: '#F1F5F9', letterSpacing: 0.3 },
  resultConfidence: { fontSize: 16, marginTop: 8, fontWeight: '600', color: '#F1F5F9' },
  resultDetails: { fontSize: 14, marginTop: 12, textAlign: 'center', color: '#E2E8F0', lineHeight: 20 },
  infoContainer: { padding: 20, marginBottom: 60, borderRadius: 16, borderWidth: 1, shadowColor: '#020617', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, letterSpacing: 0.3 },
  infoText: { fontSize: 14, lineHeight: 22, letterSpacing: 0.3 },
});

export default VideoDetection;
