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
import { ThemeContext } from '../context/ThemeContext';
import Toast from 'react-native-simple-toast';
import { getTheme } from '../context/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectVideo } from '../service/videoService';
import Video from 'react-native-video';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

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

    const userString = await AsyncStorage.getItem('user');
    if (!userString) {
      showToast('User is not logged in');
      setLoading(false);
      return;
    }

    const user = JSON.parse(userString);
    const ownerId = user._id;

    try {
      const videoData = await detectVideo(selectedVideo, ownerId);
      setResult(videoData);
    } catch (error) {
      console.error("Error analyzing video:", error);
      showToast('Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (videoUrl) => {
    try {
      const fileName = videoUrl.replace(/^.*[\\\/]/, '');
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(`${videoUrl}`, fileUri);
      const asset = await MediaLibrary.createAssetAsync(uri);
      showToast('Annotated video saved to gallery');
      return asset.uri;
    } catch (err) {
      console.error('Download video error:', err);
      showToast('Failed to download video');
      return null;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]}>

      {/* Header (UPDATED) */}
      <View style={[styles.header, { backgroundColor: t.background, borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: t.cardBg }]}
        >
          <Icon name="arrow-back" size={20} color={t.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: t.text }]}>
          Video Detection
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Upload Area */}
        <TouchableOpacity
          style={[styles.uploadArea, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          onPress={selectVideo}>
          {selectedVideo ? (
            <Video
              source={{ uri: selectedVideo.uri }}
              style={styles.videoPreview}
              paused={true}
              controls={true}
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
              result.prediction.toLowerCase() === "fake"
                ? { backgroundColor: t.resultFakeBg, borderColor: t.resultFakeBorder }
                : { backgroundColor: t.resultRealBg, borderColor: t.resultRealBorder },
            ]}>
            <Icon
              name={result.prediction.toLowerCase() === "fake" ? 'warning-outline' : 'checkmark-circle-outline'}
              size={40}
              color={result.prediction.toLowerCase() === "fake" ? '#EF4444' : '#10B981'}
            />
            <Text style={styles.resultTitle}>
              {result.prediction?.toLowerCase() === "fake" ? 'Potential Deepfake Detected' : 'Authentic Video'}
            </Text>
            {/* <Text style={styles.resultConfidence}>
              Confidence Score: {(result.probability * 100).toFixed(2)}%
            </Text> */}
            <Text style={styles.resultDetails}>{result.explanation}</Text>

            {result.annotated_video_url && (
              <Video
                source={{ uri: result.annotated_video_url }}
                style={styles.historyVideo}
                controls={true}
                paused={false}
                resizeMode="contain"
              />
            )}

            {result.annotated_video_url && (
              <TouchableOpacity
                style={[styles.detectButton, { marginTop: 16 }]}
                onPress={() => downloadVideo(result.annotated_video_url)}>
                <Text style={styles.detectButtonText}>Download Annotated Video</Text>
              </TouchableOpacity>
            )}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    elevation: 4
  },
  uploadText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  uploadSubtext: { fontSize: 14, marginTop: 8 },

  videoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12
  },

  detectButton: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24
  },
  detectButtonText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700'
  },

  resultContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#F1F5F9'
  },
  resultConfidence: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '600',
    color: '#F1F5F9'
  },
  resultDetails: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    color: '#E2E8F0'
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
    elevation: 4
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoText: { fontSize: 14, lineHeight: 22 },

  historyVideo: {
    width: '100%',
    height: 250,
    marginTop: 16,
    borderRadius: 12,
  },
});

export default VideoDetection;