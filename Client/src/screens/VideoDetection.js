import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext'; 

const VideoDetection = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext); 

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
        Video Detection
      </Text>

      <Text
        style={[
          styles.comingSoon,
          { color: darkTheme ? '#60A5FA' : '#2563EB' },
        ]}>
        Coming Soon
      </Text>

      <Text
        style={[
          styles.description,
          { color: darkTheme ? '#94A3B8' : '#475569' },
        ]}>
        This module will allow you to upload and analyze videos for deepfake
        detection.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  comingSoon: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
});

export default VideoDetection;
