import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AuthService from '../service/AuthService';
import Toast from 'react-native-simple-toast';

const SignupScreen = ({ navigation }) => {
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

  const showToast = (message) => {
    Toast.show(message, Toast.SHORT);
  };

  const selectProfileImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showToast('We need access to your gallery to select a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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
    setFormData({
      ...formData,
      profileImage: null,
    });
  };

  const handleSignup = async () => {
    const { name, username, email, password, confirmPassword } = formData;

    // Check empty fields
    if (!name || !username || !email || !password) {
      showToast('Please fill all fields');

      return;
    }

    // Username: no spaces
    if (/\s/.test(username)) {
      showToast('Username cannot contain spaces');
      return;
    }

    // Email validation
    if (!formData.email.endsWith('@gmail.com')) {
      showToast('Email must be a Gmail address');
      return;
    }

    // Password validations
    if (password.length <= 5) {
      showToast('Password must be longer than 5 characters');
      return;
    }
    if (!/\d/.test(password)) {
      showToast('Password must contain at least one digit');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      showToast('Password must contain at least one special character');
      return;
    }
    if (/\s/.test(password)) {
      showToast('Password cannot contain spaces');
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    // If all validations pass → call API
    setLoading(true);
    const result = await AuthService.signUp(formData);
    setLoading(false);

    if (result.success) {
      showToast('Account created successfully!');
      setTimeout(() => {
        navigation.replace('Login');
      }, 500);
    } else {
      showToast('Signup Failed', result.error || 'Something went wrong');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Account</Text>

      {/* Profile Image Section */}
      <View style={styles.profileImageSection}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={selectProfileImage}>
          {formData.profileImage ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: formData.profileImage.uri }}
                style={styles.profileImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeProfileImage}>
                <Icon name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="camera-outline" size={40} color="#64748B" />
              <Text style={styles.placeholderText}>Add Profile Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileImageHint}>
          Tap to add a profile photo (optional)
        </Text>
      </View>

      {/* Inputs */}
      <View style={styles.inputContainer}>
        <Icon
          name="person-outline"
          size={20}
          color="#64748B"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#94A3B8"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="at-outline" size={20} color="#64748B" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#94A3B8"
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon
          name="mail-outline"
          size={20}
          color="#64748B"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon
          name="lock-closed-outline"
          size={20}
          color="#64748B"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#64748B"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Icon
          name="lock-closed-outline"
          size={20}
          color="#64748B"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry={!showConfirmPassword}
          value={formData.confirmPassword}
          onChangeText={(text) =>
            setFormData({ ...formData, confirmPassword: text })
          }
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon
            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#64748B"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#F1F5F9',
    letterSpacing: 0.5,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    marginBottom: 10,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#334155',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 2,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  profileImageHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#1E293B',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F1F5F9',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#475569',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#94A3B8',
    fontSize: 15,
  },
  loginLink: {
    color: '#60A5FA',
    fontWeight: '600',
  },
});

export default SignupScreen;
