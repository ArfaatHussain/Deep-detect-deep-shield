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
// import axios from 'axios';
import { pickImageFromGallery } from '../utils/ImagePickerHelper';
import { ThemeContext } from '../context/ThemeContext';
// import { TAMPER_API_URL } from '../../config';
import Toast from 'react-native-simple-toast';
import { getTheme } from '../context/theme';
import { protectImage } from '../service/tamper_api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;
const showToast = (msg) => Toast.show(msg);

const ProtectScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

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
      form.append('file', { uri, name: 'image.jpg', type: 'image/jpeg' });
      const userString = await AsyncStorage.getItem("user")
      const userData = userString ? JSON.parse(userString) : {}
      form.append("owner",userData._id)
      // console.log(userData);
      const res = await protectImage(form)
      setResult(res.tamperRecord);
      showToast('Image protected successfully!');
    } catch (err) {
      console.log('Upload error:', err);
      showToast('Upload failed. Make sure the Tamper server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Download protected image to device
  const downloadProtectedImage = async () => {
    if (!result || !result.protectedImage) return showToast('No protected image available!');
    setDownloadLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return showToast('Permission required to save image!');

      const cacheDir = `${FileSystem.cacheDirectory}tamper/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

      // Full URL to protected image
      const imageUrl = `${TAMPER_API_URL.replace('/tamper','')}/${result.protectedImage.replace(/\\/g, '/')}`;
      const filename = result.protectedImage.split('/').pop();
      const localPath = `${cacheDir}${filename}`;

      await FileSystem.downloadAsync(imageUrl, localPath);
      const asset = await MediaLibrary.createAssetAsync(localPath);
      await MediaLibrary.createAlbumAsync('Download', asset, false);

      showToast('Protected image saved to gallery!');
    } catch (err) {
      console.log('Download error:', err);
      showToast('Failed to download image.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      {/* Back Button */}
      <TouchableOpacity style={[styles.backButton, { backgroundColor: t.cardBg }]} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={t.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: t.textPrimary }]}>Image Protector</Text>

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
            source={{uri:result.protectedImageUrl}}
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
  );
};


const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', flexGrow: 1 },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    padding: 10,
    borderRadius: 25,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
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
