import React, { useState, useContext, useEffect } from 'react';
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
import axios from 'axios';
import { pickImageFromGallery } from '../utils/ImagePickerHelper';
import { ThemeContext } from '../context/ThemeContext';
import { PYTHON_API_URL } from '../../config';
import Toast from 'react-native-simple-toast';
import { getTheme } from '../context/theme';
import { loadUser } from '../utils/loadUser';
import { verifyImage as verifyImageService } from '../service/tamper_api';
const screenWidth = Dimensions.get('window').width;
const showToast = (msg) => Toast.show(msg);

const VerifyScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const loadedUser = await loadUser();
      if (loadedUser) {
        setUser(loadedUser);
        // console.log("User loaded:", loadedUser);
      }
    };

    getUser();
  }, []);

  // Select image from gallery
  const selectImage = async () => {
    const img = await pickImageFromGallery();
    if (img) {
      setImage(img);
      setResult(null);
    }
  };

  // Verify image authenticity using Tamper server
  const verifyImage = async () => {
    if (!image) return showToast('Please select an image!');
    setLoading(true);
    try {
      const form = new FormData();
      const uri = image.uri.startsWith('file://') ? image.uri : `file://${image.uri}`;
      form.append('image', { uri, name: 'image.jpg', type: 'image/jpeg' });
      form.append('owner', user._id);

      const res = await verifyImageService(form);
      console.log("Result: ",res);
      setResult(res);
      showToast('Verification completed!');
    } catch (err) {
      console.log('Verification error:', err.message || err);
    } finally {
      setLoading(false);
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
        <Text style={[styles.headerTitle, { color: t.text }]}>Verify Image Authenticity</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Upload Area */}
        <TouchableOpacity
          style={[styles.uploadArea, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          onPress={selectImage}
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

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: image ? '#2563EB' : '#475569' }]}
          onPress={verifyImage}
          disabled={!image || loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#F1F5F9" style={{ marginRight: 10 }} />
              <Text style={[styles.buttonText, { color: '#F1F5F9' }]}>Verifying...</Text>
            </View>
          ) : (
            <Text style={[styles.buttonText, { color: '#F1F5F9' }]}>Verify Image</Text>
          )}
        </TouchableOpacity>

        {/* Result Card */}
        {result && (
          <View style={[styles.resultCard, {
            backgroundColor: !result.watermark_matched ? '#FEE2E2' : '#D1FAE5',
            borderColor: !result.watermark_matched ? '#FCA5A5' : '#34D399',
          }]}>
            <Icon
              name={!result.watermark_matched ? 'close-circle' : 'checkmark-circle'}
              size={40}
              color={!result.watermark_matched ? '#B91C1C' : '#047857'}
              style={{ marginBottom: 10 }}
            />
            <Text style={[styles.resultCardText, { color: !result.watermark_matched ? '#B91C1C' : '#047857' }]}>
              {!result.watermark_matched ? 'Tampered (Watermark Missing)' : 'Authentic (Watermark Found)'}
            </Text>

            {/* Extra details */}
            <Text style={{ marginTop: 8, color: '#6B7280', fontSize: 13 }}>
              Watermark Match: {result.watermark_matched ? 'Yes' : 'No'}
            </Text>
            {/* <Text style={{ color: '#6B7280', fontSize: 13 }}>
              Verified At: {new Date(result.createdAt).toLocaleString()}
            </Text> */}
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
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 80, marginBottom: 20, textAlign: 'center', letterSpacing: 0.5 },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    minHeight: 250,
  },
  uploadText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  uploadSubtext: { fontSize: 14, marginTop: 8 },
  dynamicPreviewImage: { width: screenWidth * 0.9, height: 250, borderRadius: 12 },
  actionButton: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginVertical: 10, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  buttonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  resultCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  resultCardText: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
});

export default VerifyScreen;