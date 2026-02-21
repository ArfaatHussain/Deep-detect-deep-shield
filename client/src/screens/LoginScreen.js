import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { login } from '../service/AuthService';
import Toast from 'react-native-simple-toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../context/theme';


const LoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Theme state
  const [darkTheme, setDarkTheme] = useState(false);

  // Load theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        setDarkTheme(savedTheme === 'dark');
      } catch (err) {
        console.log('Error loading theme:', err);
      }
    };
    loadTheme();
  }, []);

  const t = getTheme(darkTheme);

  const showToast = (message) => {
    Toast.show(message, Toast.SHORT);
  };

  const handleLogin = async () => {
    if (!credentials.identifier || !credentials.password) {
      showToast('Please enter both username/email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await login(credentials.identifier, credentials.password);
      const user = response.data.data.user;
      const accessToken = response.data.data.accessToken;

      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);

      Toast.show("Login successfully");
      navigation.reset({
        index: 0,
        routes: [{ name: "BottomTabs" }],
      });
    } catch (error) {
      if (error.response?.status === 401) {
        Toast.show("Invalid email or password");
      } else if (error.response?.status === 404) {
        Toast.show("User does not exist");
      } else {
        console.error("Error: ", error);
        Toast.show("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Text style={[styles.title, { color: t.textPrimary }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>Sign in to continue</Text>

      {/* Username/Email Input */}
      <View style={[styles.inputContainer, { backgroundColor: t.inputBg, borderColor: focusedInput === 'identifier' ? t.focusBorder : t.inputBorder }]}>
        <Icon
          name="person-outline"
          size={20}
          color={focusedInput === 'identifier' ? t.focusBorder : t.iconColor}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, { color: t.textPrimary, placeholderTextColor: t.placeholder }]}
          placeholder="Username or Email"
          placeholderTextColor={t.placeholder}
          value={credentials.identifier}
          onChangeText={(text) => setCredentials({ ...credentials, identifier: text })}
          onFocus={() => setFocusedInput('identifier')}
          onBlur={() => setFocusedInput(null)}
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <View style={[styles.inputContainer, { backgroundColor: t.inputBg, borderColor: focusedInput === 'password' ? t.focusBorder : t.inputBorder }]}>
        <Icon
          name="lock-closed-outline"
          size={20}
          color={focusedInput === 'password' ? t.focusBorder : t.iconColor}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, { color: t.textPrimary }]}
          placeholder="Password"
          placeholderTextColor={t.placeholder}
          secureTextEntry={!showPassword}
          value={credentials.password}
          onChangeText={(text) => setCredentials({ ...credentials, password: text })}
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput(null)}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={showPassword ? t.focusBorder : t.iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: loading ? t.buttonDisabled : t.button }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
      </TouchableOpacity>

      {/* Signup Link */}
      <TouchableOpacity onPress={() => navigation.replace('Signup')}>
        <Text style={[styles.signupText, { color: t.textSecondary }]}>
          Don&apos;t have an account?{' '}
          <Text style={[styles.signupLink, { color: t.link }]} >Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 48, letterSpacing: 0.3 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  signupText: { textAlign: 'center', marginTop: 24, fontSize: 15 },
  signupLink: { fontWeight: '600' },
});

export default LoginScreen;
