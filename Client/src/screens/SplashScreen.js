import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SplashScreen = ({ navigation }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run both animations in parallel
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Deepfake Detector
      </Animated.Text>
      <Text style={styles.subtitle}>Protecting Digital Integrity</Text>

      {/* 🔵 New Gradient Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={{ width: progressWidth, height: '100%' }}>
          <LinearGradient
            colors={['#2563EB', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBar}
          />
        </Animated.View>
      </View>

      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  logo: { width: 150, height: 150, marginBottom: 24 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 60,
    letterSpacing: 0.3,
  },
  progressContainer: {
    width: '80%',
    height: 12,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  gradientBar: {
    flex: 1,
    borderRadius: 20,
  },
  loadingText: { fontSize: 14, color: '#64748B', letterSpacing: 0.3 },
});

export default SplashScreen;
