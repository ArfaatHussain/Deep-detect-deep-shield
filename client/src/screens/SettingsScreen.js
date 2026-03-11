import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme'; 
import { loadUser } from '../utils/loadUser';
import { API_URL } from '../../config';

const SettingsScreen = ({ navigation }) => {
  const { darkTheme, toggleTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  // State management
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [user, setUser] = useState(null);

  // Profile edit states
  const [editMode, setEditMode] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await loadUser();
      setUser(userData);
      setEditedFullName(userData.fullName || userData.name || '');
      setEditedUsername(userData.username || '');
      setEditedEmail(userData.email || '');
      setProfileImage(userData.profileImage || null);
    } catch (error) {
      console.log('Error loading user:', error);
    }
  };

  /* ================= PASSWORD HELPER FUNCTIONS ================= */
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    return Math.min(strength, 3);
  };

  const getPasswordStrengthText = (password) => {
    const strength = calculatePasswordStrength(password);
    switch(strength) {
      case 1: return 'Weak';
      case 2: return 'Medium';
      case 3: return 'Strong';
      default: return 'Very weak';
    }
  };

  const getStrengthColor = (strength) => {
    switch(strength) {
      case 1: return t.error || '#FF3B30';
      case 2: return t.warning || '#FFA500';
      case 3: return t.success || '#4CD964';
      default: return t.error || '#FF3B30';
    }
  };

  const resetPasswordFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Computed property for password validation
  const isPasswordValid = 
    currentPassword.length > 0 && 
    newPassword.length >= 6 && 
    newPassword === confirmPassword;

  /* ================= THEME TOGGLE ================= */
  const handleThemeToggle = async () => {
    toggleTheme();
    try {
      await AsyncStorage.setItem('theme', darkTheme ? 'light' : 'dark');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
    setThemeModalVisible(true);
    setTimeout(() => setThemeModalVisible(false), 700);
  };

  /* ================= CLEAR HISTORY ================= */
  const handleClearHistory = async () => {
    setLoading(true);
    try {
      const user = await loadUser();
      const response = await axios.delete(`${API_URL}/user/${user._id}/history`);

      setLoading(false);
      setDeleteModalVisible(false);

      if (response.data.success) {
        Toast.show('History deleted successfully', Toast.SHORT);
      } else {
        Toast.show(response.data.message || 'No history found', Toast.SHORT);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      Toast.show('Failed to delete history');
    }
  };

  /* ================= PROFILE MANAGEMENT ================= */
  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Toast.show('Failed to pick image');
      } else {
        const source = { uri: response.assets[0].uri };
        setProfileImage(source.uri);

        // Upload image to server
        await uploadProfileImage(response.assets[0]);
      }
    });
  };

  const uploadProfileImage = async (imageAsset) => {
    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'profile.jpg',
      });

      const userData = await loadUser();
      const token = await AsyncStorage.getItem('token');

      const response = await axios.put(
        `${API_URL}/user/${userData._id}/profile-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
        Toast.show('Profile image updated successfully', Toast.SHORT);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Toast.show('Failed to upload profile image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    // Validation
    if (!editedFullName.trim()) {
      Toast.show('Full name cannot be empty');
      return;
    }
    if (!editedUsername.trim()) {
      Toast.show('Username cannot be empty');
      return;
    }
    if (!editedEmail.trim()) {
      Toast.show('Email cannot be empty');
      return;
    }
    if (!validateEmail(editedEmail)) {
      Toast.show('Please enter a valid email address');
      return;
    }
    if (!validateUsername(editedUsername)) {
      Toast.show('Username must be at least 3 characters and can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    try {
      const userData = await loadUser();
      const token = await AsyncStorage.getItem('token');

      const response = await axios.put(
        `${API_URL}/user/${userData._id}`,
        {
          fullName: editedFullName,
          username: editedUsername,
          email: editedEmail,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
        setEditMode(false);
        Toast.show('Profile updated successfully', Toast.SHORT);

        // Update stored user data
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        Toast.show(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      Toast.show(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      Toast.show('Current password is required');
      return;
    }
    if (!newPassword) {
      Toast.show('New password is required');
      return;
    }
    if (!confirmPassword) {
      Toast.show('Please confirm your new password');
      return;
    }
    if (newPassword.length < 6) {
      Toast.show('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const userData = await loadUser();
      const token = await AsyncStorage.getItem('token');

      const response = await axios.put(
        `${API_URL}/user/${userData._id}/password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Toast.show('Password changed successfully', Toast.SHORT);
        setPasswordModalVisible(false);
        // Clear password fields
        resetPasswordFields();
      } else {
        Toast.show(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error(error);
      Toast.show(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  /* ================= VALIDATION FUNCTIONS ================= */
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateUsername = (username) => {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      navigation.replace('Login');
    } catch (error) {
      console.log('Error logging out:', error);
      Toast.show('Failed to logout');
    }
  };

  /* ================= CONTACT SUPPORT ================= */
  const handleContactSupport = () => {
    const subject = 'Support Request';
    const body = 'Please describe your issue here:';
    const mailtoUrl = `mailto:support@yourapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Toast.show('Could not open email client', Toast.SHORT);
    });
  };

  /* ================= NAVIGATE TO PROFILE SCREEN ================= */
  const navigateToProfile = () => {
    navigation.navigate('Profile', {
      user,
      editMode,
      editedFullName,
      editedUsername,
      editedEmail,
      profileImage,
      imageLoading,
      loading,
      onUpdateProfile: handleUpdateProfile,
      onImagePicker: handleImagePicker,
      onEditModeToggle: () => setEditMode(!editMode),
      onCancelEdit: () => {
        setEditMode(false);
        loadUserData();
      },
      setEditedFullName,
      setEditedUsername,
      setEditedEmail,
    });
  };

  /* ================= RENDER SETTING ITEM ================= */
  const SettingItem = ({ icon, title, value, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: t.cardBg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <Icon name={icon} size={24} color={danger ? t.error : t.iconColor} />
        <Text style={[styles.settingItemText, { color: danger ? t.error : t.text }]}>
          {title}
        </Text>
      </View>
      <View style={styles.settingItemRight}>
        {value && <Text style={[styles.settingItemValue, { color: t.secondaryText }]}>{value}</Text>}
        {showArrow && <Icon name="chevron-right" size={24} color={t.iconColor} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <StatusBar barStyle={darkTheme ? 'light-content' : 'dark-content'} backgroundColor={t.background} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.headerBorder || t.border }]}>
        <Text style={[styles.headerTitle, { color: t.headerText || t.text }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section - Now navigates to separate Profile screen */}
        <TouchableOpacity
          style={[styles.profileSection, { backgroundColor: t.cardBg }]}
          onPress={navigateToProfile}
          activeOpacity={0.7}
        >
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: t.primaryColor || t.button }]}>
                <Text style={styles.profileImageText}>
                  {editedFullName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: t.success || '#4CAF50' }]}>
              <Icon name="edit" size={16} color="#FFF" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: t.textPrimary || t.text }]}>
              {editedFullName || 'User Name'}
            </Text>
            <Text style={[styles.profileEmail, { color: t.textSecondary || t.secondaryText }]}>
              {editedEmail || 'email'}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={t.iconColor} />
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary || t.secondaryText }]}>Account</Text>
          <SettingItem
            icon="lock"
            title="Change Password"
            onPress={() => setPasswordModalVisible(true)}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary || t.secondaryText }]}>Preferences</Text>

          {/* Theme Toggle */}
          <View style={[styles.settingItem, { backgroundColor: t.cardBg }]}>
            <View style={styles.settingItemLeft}>
              <Icon name={darkTheme ? 'nightlight-round' : 'wb-sunny'} size={24} color={t.iconColor} />
              <Text style={[styles.settingItemText, { color: t.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={darkTheme}
              onValueChange={handleThemeToggle}
              trackColor={{
                false: t.switchTrackFalse || '#D1D5DB',
                true: t.switchTrackTrue || '#2563EB',
              }}
              thumbColor={t.switchThumb || (darkTheme ? '#60A5FA' : '#F3F4F6')}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary || t.secondaryText }]}>Data Management</Text>
          <SettingItem
            icon="history"
            title="Clear History"
            onPress={() => setDeleteModalVisible(true)}
          />
        </View>

        {/* App Info Section */}
        <View style={[styles.section, { gap: 2 }]}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary || t.secondaryText }]}>App Info</Text>
          <SettingItem
            icon="info"
            title="About"
            onPress={() => Toast.show('Version 1.0.0', Toast.SHORT)}
            showArrow={false}
          />
          <SettingItem
            icon="help"
            title="Help & Support"
            onPress={() => setHelpModalVisible(true)}
          />
          <SettingItem
            icon="privacy-tip"
            title="Privacy Policy"
            onPress={() => setPrivacyModalVisible(true)}
          />
          <SettingItem
            icon="description"
            title="Terms of Service"
            onPress={() => setTermsModalVisible(true)}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: t.logoutBtnBg || t.cardBg }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Icon name="logout" size={24} color={t.logoutIconColor || t.error || '#a01616'} />
          <Text style={[styles.logoutText, { color: t.logoutIconColor || t.error || '#a01616' }]}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: t.textSecondary || t.secondaryText }]}>
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* Theme Change Modal */}
      <Modal
        transparent
        visible={themeModalVisible}
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.themeModalContent, { backgroundColor: t.modalBg || t.cardBg }]}>
            <Icon name={darkTheme ? 'nightlight-round' : 'wb-sunny'} size={40} color={t.primaryColor || t.button} />
            <Text style={[styles.themeModalText, { color: t.modalText || t.text }]}>
              {darkTheme ? 'Dark Mode Enabled' : 'Light Mode Enabled'}
            </Text>
            <Text style={[styles.themeModalSubtext, { color: t.textSecondary || t.secondaryText }]}>
              Theme changed successfully
            </Text>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.deleteModalContent, { backgroundColor: t.background }]}>
            <Icon name="warning" size={50} color={t.error || '#a01616'} />
            <Text style={[styles.deleteModalTitle, { color: t.text }]}>
              Clear History
            </Text>
            <Text style={[styles.deleteModalText, { color: t.textSecondary || t.secondaryText }]}>
              Are you sure you want to delete all your history? This action cannot be undone.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { borderColor: t.inputBorder || t.border }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={loading}
              >
                <Text style={[styles.deleteModalButtonText, { color: t.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton, { backgroundColor: t.error || '#a01616' }]}
                onPress={handleClearHistory}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Clear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={[styles.centeredModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.logoutModalContent, { backgroundColor: t.background }]}>
            <Text style={[styles.logoutModalTitle, { color: t.text }]}>
              Logout
            </Text>
            <Text style={[styles.logoutModalText, { color: t.textSecondary || t.secondaryText }]}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={[styles.logoutCancelButton, { 
                  borderColor: t.inputBorder || t.border,
                  backgroundColor: t.logoutBtnBg || '#33363a'
                }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.logoutCancelButtonText, { color: '#FFF' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmButton, { backgroundColor: t.error || '#a01616' }]}
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.logoutConfirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={[styles.centeredModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.fullModalContent, { backgroundColor: t.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: t.modalBorder || t.border }]}>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Icon name="close" size={24} color={t.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: t.titleColor || t.text }]}>Help & Support</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.helpSection}>
                <Text style={[styles.helpTitle, { color: t.text }]}>Frequently Asked Questions</Text>
                
                <View style={[styles.faqItem, { backgroundColor: t.cardBg }]}>
                  <Text style={[styles.faqQuestion, { color: t.text }]}>• How do I reset my password?</Text>
                  <Text style={[styles.faqAnswer, { color: t.textSecondary || t.secondaryText }]}>
                    Go to Settings > Account > Change Password. Enter your current password and then your new password.
                  </Text>
                </View>

                <View style={[styles.faqItem, { backgroundColor: t.cardBg }]}>
                  <Text style={[styles.faqQuestion, { color: t.text }]}>• How do I clear my history?</Text>
                  <Text style={[styles.faqAnswer, { color: t.textSecondary || t.secondaryText }]}>
                    Navigate to Settings > Data Management > Clear History to remove all your search history.
                  </Text>
                </View>

                <View style={[styles.faqItem, { backgroundColor: t.cardBg }]}>
                  <Text style={[styles.faqQuestion, { color: t.text }]}>• How do I update my profile?</Text>
                  <Text style={[styles.faqAnswer, { color: t.textSecondary || t.secondaryText }]}>
                    Tap on your profile picture at the top of Settings to edit your profile information.
                  </Text>
                </View>

                <View style={[styles.faqItem, { backgroundColor: t.cardBg }]}>
                  <Text style={[styles.faqQuestion, { color: t.text }]}>• How do I change the theme?</Text>
                  <Text style={[styles.faqAnswer, { color: t.textSecondary || t.secondaryText }]}>
                    Go to Settings > Preferences and toggle the Dark Mode switch.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: t.button || '#2563EB' }]}
                onPress={handleContactSupport}
              >
                <Icon name="email" size={20} color="#FFF" />
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={[styles.centeredModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.fullModalContent, { backgroundColor: t.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: t.modalBorder || t.border }]}>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Icon name="close" size={24} color={t.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: t.titleColor || t.text }]}>Privacy Policy</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.privacySection}>
                <Text style={[styles.privacyText, { color: t.textSecondary || t.secondaryText }]}>
                  Last updated: March 2026
                </Text>

                <Text style={[styles.privacyTitle, { color: t.text }]}>Information We Collect</Text>
                <Text style={[styles.privacyText, { color: t.textSecondary || t.secondaryText }]}>
                  We collect information you provide directly to us, such as when you create an account, update your profile, or contact us for support. This may include your name, email address, and profile information.
                </Text>

                <Text style={[styles.privacyTitle, { color: t.text }]}>How We Use Your Information</Text>
                <Text style={[styles.privacyText, { color: t.textSecondary || t.secondaryText }]}>
                  We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience.
                </Text>

                <Text style={[styles.privacyTitle, { color: t.text }]}>Data Security</Text>
                <Text style={[styles.privacyText, { color: t.textSecondary || t.secondaryText }]}>
                  We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access.
                </Text>

                <Text style={[styles.privacyTitle, { color: t.text }]}>Contact Us</Text>
                <Text style={[styles.privacyText, { color: t.textSecondary || t.secondaryText }]}>
                  If you have any questions about this Privacy Policy, please contact us at privacy@yourapp.com
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={[styles.centeredModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.fullModalContent, { backgroundColor: t.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: t.modalBorder || t.border }]}>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Icon name="close" size={24} color={t.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: t.titleColor || t.text }]}>Terms of Service</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.termsSection}>
                <Text style={[styles.termsText, { color: t.textSecondary || t.secondaryText }]}>
                  Last updated: March 2026 | Version 1.0.0
                </Text>

                <Text style={[styles.termsTitle, { color: t.text }]}>1. Acceptance of Terms</Text>
                <Text style={[styles.termsText, { color: t.textSecondary || t.secondaryText }]}>
                  By accessing or using our app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
                </Text>

                <Text style={[styles.termsTitle, { color: t.text }]}>2. User Accounts</Text>
                <Text style={[styles.termsText, { color: t.textSecondary || t.secondaryText }]}>
                  You are responsible for maintaining the security of your account. You must notify us immediately of any unauthorized use of your account.
                </Text>

                <Text style={[styles.termsTitle, { color: t.text }]}>3. User Conduct</Text>
                <Text style={[styles.termsText, { color: t.textSecondary || t.secondaryText }]}>
                  You agree not to use the app for any unlawful purpose or to violate any laws. You are solely responsible for your conduct while using our services.
                </Text>

                <Text style={[styles.termsTitle, { color: t.text }]}>4. Termination</Text>
                <Text style={[styles.termsText, { color: t.textSecondary || t.secondaryText }]}>
                  We reserve the right to suspend or terminate your account at any time for violations of these terms.
                </Text>

                <Text style={[styles.termsTitle, { color: t.text }]}>5. Changes to Terms</Text>
                <Text style={[styles.termsText, { color: t.textSecondary || t.secondaryText }]}>
                  We may modify these terms at any time. We will notify you of any changes by posting the new terms on this page.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setPasswordModalVisible(false);
          resetPasswordFields();
        }}
      >
        <KeyboardAvoidingView
          style={[styles.centeredModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={[styles.centeredModalContent, { backgroundColor: t.background }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: t.modalBorder || t.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    setPasswordModalVisible(false);
                    resetPasswordFields();
                  }}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={24} color={t.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: t.titleColor || t.text }]}>Change Password</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.centeredScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalFields}>
                  {/* Password Requirements Card */}
                  <View style={[styles.requirementsCard, { backgroundColor: t.cardBg }]}>
                    <Icon name="info" size={20} color={t.iconColor} />
                    <Text style={[styles.requirementsText, { color: t.descriptionText || t.textSecondary }]}>
                      Password must be at least 6 characters long with at least one number and one letter
                    </Text>
                  </View>

                  {/* Current Password */}
                  <View style={styles.modalField}>
                    <Text style={[styles.modalFieldLabel, { color: t.labelText || t.text }]}>Current Password</Text>
                    <View style={[styles.inputWrapper, { borderColor: t.inputBorder || t.border }]}>
                      <Icon name="lock" size={20} color={t.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: t.text }]}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor={t.placeholder || t.textSecondary}
                        secureTextEntry={!showCurrentPassword}
                        autoFocus={true}
                      />
                      <TouchableOpacity
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={styles.visibilityToggle}
                      >
                        <Icon
                          name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                          size={24}
                          color={t.iconColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* New Password */}
                  <View style={styles.modalField}>
                    <Text style={[styles.modalFieldLabel, { color: t.labelText || t.text }]}>New Password</Text>
                    <View style={[styles.inputWrapper, { borderColor: t.inputBorder || t.border }]}>
                      <Icon name="vpn-key" size={20} color={t.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: t.text }]}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor={t.placeholder || t.textSecondary}
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.visibilityToggle}
                      >
                        <Icon
                          name={showNewPassword ? 'visibility' : 'visibility-off'}
                          size={24}
                          color={t.iconColor}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && (
                      <View style={styles.strengthContainer}>
                        <View style={styles.strengthBars}>
                          {[1, 2, 3].map((level) => (
                            <View
                              key={level}
                              style={[
                                styles.strengthBar,
                                {
                                  backgroundColor: newPassword.length >= 6 &&
                                    (level <= calculatePasswordStrength(newPassword)
                                      ? getStrengthColor(calculatePasswordStrength(newPassword))
                                      : (t.inputBorder || t.border))
                                }
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={[styles.strengthText, { color: t.textSecondary }]}>
                          {getPasswordStrengthText(newPassword)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.modalField}>
                    <Text style={[styles.modalFieldLabel, { color: t.labelText || t.text }]}>Confirm Password</Text>
                    <View style={[
                      styles.inputWrapper,
                      {
                        borderColor: confirmPassword && newPassword !== confirmPassword
                          ? (t.error || '#FF3B30')
                          : (t.inputBorder || t.border)
                      }
                    ]}>
                      <Icon name="lock" size={20} color={t.iconColor} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: t.text }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor={t.placeholder || t.textSecondary}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.visibilityToggle}
                      >
                        <Icon
                          name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                          size={24}
                          color={t.iconColor}
                        />
                      </TouchableOpacity>
                    </View>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <Text style={[styles.errorText, { color: t.error || '#FF3B30' }]}>Passwords do not match</Text>
                    )}
                  </View>

                  {/* Update Button */}
                  <TouchableOpacity
                    style={[
                      styles.updateButton,
                      (!isPasswordValid || passwordLoading) && styles.updateButtonDisabled,
                      { backgroundColor: t.button || '#2563EB' }
                    ]}
                    onPress={handleChangePassword}
                    disabled={!isPasswordValid || passwordLoading}
                  >
                    {passwordLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.updateButtonText}>Update Password</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileImageText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 2,
    borderRadius: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemValue: {
    fontSize: 14,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeModalContent: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  themeModalText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  themeModalSubtext: {
    fontSize: 14,
  },
  deleteModalContent: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: '#a01616',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Logout Modal Styles
  logoutModalContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  logoutModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  logoutCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  logoutConfirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutConfirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    gap: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalFields: {
    padding: 20,
  },
  modalField: {
    marginBottom: 20,
  },
  modalFieldLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  // Centered Modal Styles
  centeredModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  centeredModalContent: {
    width: 350,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  centeredScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    left: 0,
    paddingRight: 4,
    top: 2,
  },
  editButton: {
    padding: 4,
  },
  requirementsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  requirementsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  visibilityToggle: {
    padding: 8,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Profile Modal Specific Styles
  profileImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  profileImageTouchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileImagePlaceholderLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileImageLargeText: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileCameraBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
  },
  memberText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  editActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelEditButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelEditButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveEditButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveEditButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Help Modal Styles
  fullModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalBody: {
    padding: 20,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  faqItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    gap: 10,
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Privacy & Terms Styles
  privacySection: {
    padding: 5,
    paddingBottom:40
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  termsSection: {
    padding: 5,
    paddingBottom:40
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
});

export default SettingsScreen;