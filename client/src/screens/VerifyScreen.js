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
import axios from 'axios';
import { pickImageFromGallery } from '../utils/ImagePickerHelper';
import { ThemeContext } from '../context/ThemeContext';
import { TAMPER_API_URL } from '../../config';
import Toast from 'react-native-simple-toast';
import { getTheme } from '../context/theme';

const screenWidth = Dimensions.get('window').width;
const showToast = (msg) => Toast.show(msg);

const VerifyScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t =getTheme(darkTheme);

  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
      form.append('watermark', 'Tamper-Protected');

      const res = await axios.post(`${TAMPER_API_URL}/verify`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(res.data);
      showToast('Verification completed!');
    } catch (err) {
      console.log('Verification error:', err.message || err);
      showToast('Verification failed. Make sure the Tamper server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: t.cardBg }]}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={t.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: t.textPrimary }]}>Verify Image Authenticity</Text>

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
        <View
          style={[
            styles.resultCard,
            {
              backgroundColor: result.tampered ? '#FEE2E2' : '#D1FAE5',
              borderColor: result.tampered ? '#FCA5A5' : '#34D399',
            },
          ]}
        >
          <Icon
            name={result.tampered ? 'close-circle' : 'checkmark-circle'}
            size={40}
            color={result.tampered ? '#B91C1C' : '#047857'}
            style={{ marginBottom: 10 }}
          />
          <Text
            style={[
              styles.resultCardText,
              { color: result.tampered ? '#B91C1C' : '#047857' },
            ]}
          >
            {result.tampered
              ? 'Tampered (Watermark Missing)'
              : 'Authentic (Watermark Found)'}
          </Text>
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
