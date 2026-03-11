// ProfileScreen.js
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';

const ProfileScreen = ({ route, navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const {
    user,
    editMode,
    editedFullName,
    editedUsername,
    editedEmail,
    profileImage,
    imageLoading,
    loading,
    onUpdateProfile,
    onImagePicker,
    onEditModeToggle,
    onCancelEdit,
    setEditedFullName,
    setEditedUsername,
    setEditedEmail,
  } = route.params;

  // Local state for handling unsaved changes
  const [localEditMode, setLocalEditMode] = useState(editMode);
  const [localFullName, setLocalFullName] = useState(editedFullName);
  const [localUsername, setLocalUsername] = useState(editedUsername);
  const [localEmail, setLocalEmail] = useState(editedEmail);

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
        onImagePicker(response.assets[0]);
      }
    });
  };

  const handleSave = async () => {
    // Update parent state before saving
    setEditedFullName(localFullName);
    setEditedUsername(localUsername);
    setEditedEmail(localEmail);
    await onUpdateProfile();
  };

  const handleCancel = () => {
    setLocalFullName(editedFullName);
    setLocalUsername(editedUsername);
    setLocalEmail(editedEmail);
    setLocalEditMode(false);
    onCancelEdit();
  };

  const handleEditToggle = () => {
    setLocalEditMode(!localEditMode);
    onEditModeToggle();
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateUsername = (username) => {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      <StatusBar barStyle={darkTheme ? 'light-content' : 'dark-content'} backgroundColor={t.background} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.headerBorder || t.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.headerText || t.text }]}>
          {localEditMode ? 'Edit Profile' : 'Profile'}
        </Text>
        {!localEditMode ? (
          <TouchableOpacity onPress={handleEditToggle} style={styles.headerButton}>
            <Icon name="edit" size={24} color={t.iconColor} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.headerButton}>
            {loading ? (
              <ActivityIndicator size="small" color={t.iconColor} />
            ) : (
              <Icon name="check" size={24} color={t.success || '#2563EB'} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <View style={[styles.profileImageSection, { backgroundColor: t.cardBg }]}>
            <View style={styles.profileImageWrapper}>
              <TouchableOpacity
                onPress={localEditMode ? handleImagePicker : null}
                disabled={!localEditMode || imageLoading}
                activeOpacity={0.7}
                style={styles.profileImageTouchable}
              >
                {imageLoading ? (
                  <View style={[styles.profileImagePlaceholderLarge, { backgroundColor: t.cardBg }]}>
                    <ActivityIndicator size="large" color={t.button || '#2563EB'} />
                  </View>
                ) : profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImageLarge} />
                ) : (
                  <View style={[styles.profileImagePlaceholderLarge, { backgroundColor: t.button || '#2563EB' }]}>
                    <Text style={styles.profileImageLargeText}>
                      {localFullName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                {localEditMode && !imageLoading && (
                  <View style={[styles.profileCameraBadge, { backgroundColor: t.success || '#4CAF50' }]}>
                    <Icon name="camera-alt" size={18} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {!localEditMode && (
              <Text style={[styles.profileName, { color: t.text }]}>
                {localFullName || 'User Name'}
              </Text>
            )}
          </View>

          {/* Profile Fields Section */}
          <View style={[styles.fieldsSection, { backgroundColor: t.cardBg }]}>
            {/* Full Name Field */}
            <View style={[styles.fieldContainer, styles.firstField]}>
              <View style={styles.fieldLabelContainer}>
                <Icon name="person" size={20} color={t.iconColor} />
                <Text style={[styles.fieldLabel, { color: t.labelText || t.textSecondary }]}>
                  Full Name
                </Text>
              </View>
              {localEditMode ? (
                <View style={[styles.inputWrapper, { borderColor: t.inputBorder || t.border }]}>
                  <TextInput
                    style={[styles.input, { color: t.text }]}
                    value={localFullName}
                    onChangeText={setLocalFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={t.placeholder || t.textSecondary}
                  />
                </View>
              ) : (
                <Text style={[styles.fieldValue, { color: t.text }]}>
                  {localFullName || 'Not set'}
                </Text>
              )}
            </View>

            {/* Username Field */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelContainer}>
                <Icon name="alternate-email" size={20} color={t.iconColor} />
                <Text style={[styles.fieldLabel, { color: t.labelText || t.textSecondary }]}>
                  Username
                </Text>
              </View>
              {localEditMode ? (
                <View style={[styles.inputWrapper, { borderColor: t.inputBorder || t.border }]}>
                  <TextInput
                    style={[styles.input, { color: t.text }]}
                    value={localUsername}
                    onChangeText={setLocalUsername}
                    placeholder="username"
                    placeholderTextColor={t.placeholder || t.textSecondary}
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <Text style={[styles.fieldValue, { color: t.text }]}>
                  @{localUsername || 'username'}
                </Text>
              )}
            </View>

            {/* Email Field */}
            <View style={[styles.fieldContainer, styles.lastField]}>
              <View style={styles.fieldLabelContainer}>
                <Icon name="email" size={20} color={t.iconColor} />
                <Text style={[styles.fieldLabel, { color: t.labelText || t.textSecondary }]}>
                  Email
                </Text>
              </View>
              {localEditMode ? (
                <View style={[styles.inputWrapper, { borderColor: t.inputBorder || t.border }]}>
                  <TextInput
                    style={[styles.input, { color: t.text }]}
                    value={localEmail}
                    onChangeText={setLocalEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={t.placeholder || t.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <Text style={[styles.fieldValue, { color: t.text }]}>
                  {localEmail || 'email@example.com'}
                </Text>
              )}
            </View>
          </View>

          {/* Account Info Section */}
          {!localEditMode && user && (
            <View style={[styles.infoSection, { backgroundColor: t.cardBg }]}>
              <View style={styles.infoRow}>
                <Icon name="info" size={20} color={t.iconColor} />
                <Text style={[styles.infoLabel, { color: t.labelText || t.textSecondary }]}>
                  Member since:
                </Text>
                <Text style={[styles.infoValue, { color: t.text }]}>
                  {formatDate(user?.createdAt)}
                </Text>
              </View>

              <View style={[styles.infoRow, styles.lastInfoRow]}>
                <Icon name="verified-user" size={20} color={t.iconColor} />
                <Text style={[styles.infoLabel, { color: t.labelText || t.textSecondary }]}>
                  Account status:
                </Text>
                <Text style={[styles.infoValue, { color: t.success || '#4CAF50' }]}>
                  Active
                </Text>
              </View>
            </View>
          )}

          {/* Validation Tips (only in edit mode) */}
          {localEditMode && (
            <View style={[styles.tipsSection, { backgroundColor: t.cardBg }]}>
              <Text style={[styles.tipsTitle, { color: t.text }]}>
                <Icon name="info" size={16} color={t.iconColor} /> Tips
              </Text>
              <View style={styles.tipItem}>
                <Icon name="circle" size={8} color={t.iconColor} style={styles.tipBullet} />
                <Text style={[styles.tipText, { color: t.textSecondary }]}>
                  Username must be 3-20 characters and can contain letters, numbers, and underscores
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Icon name="circle" size={8} color={t.iconColor} style={styles.tipBullet} />
                <Text style={[styles.tipText, { color: t.textSecondary }]}>
                  Email must be a valid email address
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Icon name="circle" size={8} color={t.iconColor} style={styles.tipBullet} />
                <Text style={[styles.tipText, { color: t.textSecondary }]}>
                  Tap the camera icon to change your profile picture
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons for Edit Mode */}
          {localEditMode && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { 
                  borderColor: t.inputBorder || t.border,
                  backgroundColor: t.logoutBtnBg || '#33363a'
                }]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, { color: '#FFF' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                  { backgroundColor: t.button || '#2563EB' }
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerButton: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  profileImageTouchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileImagePlaceholderLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileImageLargeText: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  profileCameraBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
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
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 5,
  },
  fieldsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  fieldContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  firstField: {
    paddingTop: 16,
  },
  lastField: {
    borderBottomWidth: 0,
    paddingBottom: 16,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  fieldValue: {
    fontSize: 16,
    marginLeft: 28,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    marginLeft: 28,
  },
  input: {
    height: 44,
    fontSize: 16,
    paddingHorizontal: 12,
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  lastInfoRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 12,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  tipsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    marginTop: 6,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;