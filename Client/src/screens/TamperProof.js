import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';
import Toast from 'react-native-simple-toast';

const TamperProof = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);

  const handleUploadPress = () => {
    Toast.show('Tamper-Proof feature coming soon!', Toast.SHORT);
  };

  return (
    <View
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
        onPress={() => navigation.navigate('Dashboard')}>
        <Icon
          name="arrow-back"
          size={24}
          color={darkTheme ? '#F1F5F9' : '#1E293B'}
        />
      </TouchableOpacity>

      <Text
        style={[styles.title, { color: darkTheme ? '#F1F5F9' : '#1E293B' }]}>
        Tamper-Proof Media
      </Text>

      {/* Upload Area */}
      <TouchableOpacity
        style={[
          styles.uploadArea,
          {
            backgroundColor: darkTheme ? '#1E293B' : '#E2E8F0',
            borderColor: darkTheme ? '#334155' : '#CBD5E1',
          },
        ]}
        onPress={handleUploadPress}>
        <Icon
          name="shield-checkmark-outline"
          size={50}
          color={darkTheme ? '#64748B' : '#475569'}
        />
        <Text
          style={[
            styles.uploadText,
            { color: darkTheme ? '#F1F5F9' : '#1E293B' },
          ]}>
          Upload Media
        </Text>
        <Text
          style={[
            styles.uploadSubtext,
            { color: darkTheme ? '#94A3B8' : '#475569' },
          ]}>
          Make your files tamper-proof
        </Text>
      </TouchableOpacity>


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
          What this module will do:
        </Text>
        <Text
          style={[
            styles.infoText,
            { color: darkTheme ? '#94A3B8' : '#475569' },
          ]}>
          • Embed digital watermarks{'\n'}
          • Add secure metadata{'\n'}
          • Prevent unauthorized editing{'\n'}
          • Provide tamper detection
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 80,
    marginBottom: 24,
    textAlign: 'center',
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
  uploadText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  uploadSubtext: { fontSize: 14, marginTop: 8 },
  infoContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoText: { fontSize: 14, lineHeight: 22 },
});

export default TamperProof;