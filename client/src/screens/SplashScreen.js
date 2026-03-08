import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../context/theme';

const SplashScreen = ({ navigation }) => {
  const [darkTheme, setDarkTheme] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Load saved theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        setDarkTheme(savedTheme === 'dark');
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        setThemeLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Start animations
  useEffect(() => {
    if (!themeLoaded) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

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
  }, [themeLoaded, navigation]);

 const t= getTheme(darkTheme);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Logo Pulse */}
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }], borderColor: t.logoBorder }]}>
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* App Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            color: t.title,
            opacity: fadeAnim,
            textShadowColor: t.titleShadow,
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4,
          },
        ]}
      >
        Deepfake Detector
      </Animated.Text>

      <Text style={[styles.subtitle, { color: t.subtitle }]}>Protecting Digital Integrity</Text>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: t.progressBg }]}>
        <Animated.View
          style={{
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            height: '100%',
          }}
        >
          <LinearGradient
            colors={[t.gradientStart, t.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBar}
          />
        </Animated.View>
      </View>

      <Text style={[styles.loadingText, { color: t.loadingText }]}>Loading...</Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: { width: '100%', height: '100%' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 12, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, marginBottom: 60, letterSpacing: 0.3 },
  progressContainer: { width: '80%', height: 12, borderRadius: 20, marginBottom: 24, overflow: 'hidden' },
  gradientBar: { flex: 1, borderRadius: 20 },
  loadingText: { fontSize: 14, letterSpacing: 0.3 },
});

export default SplashScreen;