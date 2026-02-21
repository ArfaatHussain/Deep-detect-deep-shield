import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { register } from '../service/AuthService';
import Toast from 'react-native-simple-toast';
import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';

const SignupScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext); 
  const t = getTheme(darkTheme); 

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const showToast = (message) => {
    Toast.show(message, Toast.SHORT);
  };

  const selectProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast('We need access to your gallery to select a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      setFormData({
        ...formData,
        profileImage: {
          uri: image.uri,
          type: 'image/jpeg',
          fileName: 'profile.jpg',
        },
      });
    }
  };

  const removeProfileImage = () => {
    setFormData({ ...formData, profileImage: null });
  };

  const handleSignup = async () => {
    const { name, username, email, password, confirmPassword, profileImage } = formData;

    if (!name || !username || !email || !password) {
      showToast('Please fill all fields');
      return;
    }
    if (/\s/.test(username.trim())) {
      showToast('Username cannot contain spaces');
      return;
    }
    if (!email.endsWith('@gmail.com')) {
      showToast('Email must be a Gmail address');
      return;
    }
    if (password.length <= 5) {
      showToast('Password must be longer than 5 characters');
      return;
    }
    if (!/\d/.test(password)) {
      showToast('Password must contain at least one digit');
      return;
    }
    if (/\s/.test(password)) {
      showToast('Password cannot contain spaces');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append('fullName', name);
      form.append('username', username);
      form.append('email', email);
      form.append('password', password);

      if (profileImage) {
        form.append('avatar', {
          uri: profileImage.uri,
          type: profileImage.type || 'image/jpeg',
          name: 'avatar.jpg',
        });
      }

      const response = await register(form);
      Toast.show('User created successfully');
      navigation.navigate('Login');
    } catch (error) {
      if (error.response?.status === 409) {
        showToast('User already exists with this email or username');
      } else {
        console.error('Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: t.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Create Account</Text>

          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={selectProfileImage}>
              {formData.profileImage ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: formData.profileImage.uri }}
                    style={[styles.profileImage, { borderColor: t.inputBorder }]}
                  />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: t.cardBg }]}
                    onPress={removeProfileImage}
                  >
                    <Icon name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.placeholderImage, { borderColor: t.inputBorder, backgroundColor: t.cardBg }]}>
                  <Icon name="camera-outline" size={40} color={t.iconColor} />
                  <Text style={[styles.placeholderText, { color: t.textSecondary }]}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={[styles.profileImageHint, { color: t.textSecondary }]}>
              Tap to add a profile photo (optional)
            </Text>
          </View>

          {/* Inputs */}
          {[
            { key: 'name', placeholder: 'Full Name', icon: 'person-outline' },
            { key: 'username', placeholder: 'Username', icon: 'at-outline' },
            { key: 'email', placeholder: 'Email', icon: 'mail-outline', keyboardType: 'email-address' },
            { key: 'password', placeholder: 'Password', icon: 'lock-closed-outline', secure: !showPassword, toggle: () => setShowPassword(!showPassword) },
            { key: 'confirmPassword', placeholder: 'Confirm Password', icon: 'lock-closed-outline', secure: !showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
          ].map((field) => (
            <View
              key={field.key}
              style={[
                styles.inputContainer,
                { backgroundColor: t.inputBg, borderColor: focusedInput === field.key ? t.focusBorder : t.inputBorder },
              ]}
            >
              <Icon
                name={field.icon}
                size={20}
                color={focusedInput === field.key ? t.focusBorder : t.iconColor}
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, { color: t.textPrimary }]}
                placeholder={field.placeholder}
                placeholderTextColor={t.placeholder}
                secureTextEntry={field.secure}
                value={formData[field.key]}
                keyboardType={field.keyboardType || 'default'}
                onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                onFocus={() => setFocusedInput(field.key)}
                onBlur={() => setFocusedInput(null)}
              />
              {field.toggle && (
                <TouchableOpacity onPress={field.toggle}>
                  <Icon
                    name={field.secure ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={focusedInput === field.key ? t.focusBorder : t.iconColor}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: loading ? t.buttonDisabled : t.button }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={[styles.loginText, { color: t.textSecondary }]}>
              Already have an account? <Text style={[styles.loginLink, { color: t.link }]}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, letterSpacing: 0.5 },
  profileImageSection: { alignItems: 'center', marginBottom: 30 },
  profileImageContainer: { marginBottom: 10, padding: 10 },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 150, height: 150, borderRadius: 100, borderWidth: 3 },
  removeImageButton: { position: 'absolute', top: -5, right: -5, borderRadius: 12, padding: 2 },
  placeholderImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { marginTop: 8, fontSize: 12, textAlign: 'center' },
  profileImageHint: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 20, paddingHorizontal: 16, height: 56 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  loginText: { textAlign: 'center', marginTop: 24, fontSize: 15 },
  loginLink: { fontWeight: '600' },
});

export default SignupScreen;
