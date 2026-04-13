import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { File, Directory, Paths, } from 'expo-file-system';
// import axios from 'axios';
import { pickImageFromGallery } from '../utils/ImagePickerHelper';
import { ThemeContext } from '../context/ThemeContext';
// import { TAMPER_API_URL } from '../../config';
import Toast from 'react-native-simple-toast';
import { getTheme } from '../context/theme';
import { protectImage } from '../service/tamper_api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PYTHON_API_URL } from '../../config';

const screenWidth = Dimensions.get('window').width;
const showToast = (msg) => Toast.show(msg);

const ProtectScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // Select image from gallery
  const selectImage = async () => {
    const img = await pickImageFromGallery();
    if (img) {
      setImage(img);
      setResult(null);
    }
  };

  // Upload image to Tamper server
  const uploadImage = async () => {
    if (!image) return showToast('Select an image first!');
    setLoading(true);
    try {
      const form = new FormData();
      const uri = image.uri.startsWith('file://') ? image.uri : `file://${image.uri}`;
      form.append('image', { uri, name: 'image.jpg', type: 'image/jpeg' });
      const userString = await AsyncStorage.getItem("user")
      const userData = userString ? JSON.parse(userString) : {}
      form.append("owner", userData._id)
      const res = await protectImage(form)
      console.log('Upload response:', res);
      const refinedData = res.data
      setResult(refinedData);
    } catch (err) {
      console.log('Upload error:', err);
      showToast('Upload failed. Make sure the Tamper server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Download protected image to device
  const downloadProtectedImage = async () => {
    if (!result?.protected_image_url) return showToast('No protected image!');

    setDownloadLoading(true);
    try {
      if (permissionResponse?.status !== 'granted') {
        const res = await requestPermission();
        if (!res.granted) {
          showToast('Permission denied');
          setDownloadLoading(false);
          return;
        }
      }

      const imageUrl = `${result.protected_image_url}`;
      const fileName = imageUrl.split('/uploads/').pop();

      // Use Expo FileSystem for temp storage
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const downloaded = await FileSystem.downloadAsync(imageUrl, fileUri);

      // Save to gallery
      await MediaLibrary.createAssetAsync(downloaded.uri);

      showToast('Protected image saved to gallery!');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download image.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header - Updated to match Privacy Policy style */}
      <View style={[styles.header, { backgroundColor: t.background, borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: t.cardBg }]}
        >
          <Icon name="arrow-back" size={20} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.text }]}>Image Protector</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Upload Area */}
        <TouchableOpacity
          style={[styles.uploadArea, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          onPress={selectImage}
          activeOpacity={0.8}
        >
          {image ? (
            <Image
              source={{ uri: image.uri }}
              style={styles.dynamicPreviewImage}
              resizeMode="contain"
            />
          ) : (
            <>
              <Icon name="cloud-upload-outline" size={50} color={t.iconColor} />
              <Text style={[styles.uploadText, { color: t.textPrimary }]}>Select Image</Text>
              <Text style={[styles.uploadSubtext, { color: t.textSecondary }]}>Tap to choose from gallery</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Protect Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: image ? '#2563EB' : '#475569' }]}
          onPress={uploadImage}
          disabled={!image || loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#F1F5F9" style={{ marginRight: 10 }} />
              <Text style={[styles.buttonText, { color: '#F1F5F9' }]}>Protecting...</Text>
            </View>
          ) : (
            <Text style={[styles.buttonText, { color: '#F1F5F9' }]}>Protect Image</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={[styles.resultBox, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            <Image
              source={{ uri: `${result.protected_image_url}` }}
              style={styles.resultImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2563EB' }]}
              onPress={downloadProtectedImage}
              disabled={downloadLoading}
            >
              {downloadLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#F1F5F9" style={{ marginRight: 10 }} />
                  <Text style={[styles.buttonText, { color: '#F1F5F9' }]}>Downloading...</Text>
                </View>
              ) : (
                <Text style={[styles.buttonText, { color: '#F1F5F9' }]}>Download Protected Image</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // New header styles matching Privacy Policy
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
    alignItems: 'center',
    flexGrow: 1,
  },
  // Rest of the styles remain exactly the same
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 80, marginBottom: 20, textAlign: 'center', letterSpacing: 0.5 },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    minHeight: 250,
  },
  uploadText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  uploadSubtext: { fontSize: 14, marginTop: 8 },
  dynamicPreviewImage: { width: screenWidth * 0.9, height: 250, borderRadius: 12 },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  resultBox: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resultImage: { width: '90%', height: 250, borderRadius: 10, marginBottom: 15 },
});

export default ProtectScreen;