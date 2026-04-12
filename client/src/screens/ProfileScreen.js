import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  ActivityIndicator, ScrollView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { loadUser } from '../utils/loadUser';
import { updateUser } from '../service/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
const ProfileScreen = ({ route, navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);
  const accentColor = t.button || '#2563EB';

  const { user, editedFullName, editedUsername, editedEmail, avatar: initialImage } = route.params;

  const [localEditMode, setLocalEditMode] = useState(false);
  const [localFullName, setLocalFullName] = useState(editedFullName);
  const [localUsername, setLocalUsername] = useState(editedUsername);
  const [localEmail, setLocalEmail] = useState(editedEmail);
  const [localImage, setLocalImage] = useState(initialImage);
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localImageAsset, setLocalImageAsset] = useState(null); // ← add this

  const handleImagePicker = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: false, maxHeight: 500, maxWidth: 500, quality: 0.8 },
      (response) => {
        if (response.didCancel) return;
        if (response.error) { Toast.show('Failed to pick image'); return; }
        const asset = response.assets[0];
        setLocalImage(asset.uri);
        setLocalImageAsset(asset); // ← store the full asset for later
      }
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Always append text fields
      formData.append('fullName', localFullName);
      formData.append('username', localUsername);
      formData.append('email', localEmail);

      // Only append avatar if user picked a new one
      if (localImageAsset) {
        formData.append('avatar', {
          uri: localImageAsset.uri,
          type: localImageAsset.type || 'image/jpeg',
          name: localImageAsset.fileName || 'profile.jpg',
        });
      }

      const response = await updateUser(user._id, formData);

      Toast.show('Profile updated successfully', Toast.SHORT);
      setLocalEditMode(false);
      setLocalImageAsset(null); // clear after save
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));

      navigation.navigate('Settings', {
        updatedProfile: {
          fullName: response.data.data.fullName,
          username: response.data.data.username,
          email: response.data.data.email,
          avatar: response.data.data.avatar,
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLocalFullName(editedFullName);
    setLocalUsername(editedUsername);
    setLocalEmail(editedEmail);
    setLocalImage(initialImage); // ← reset preview too
    setLocalImageAsset(null);    // ← discard unpicked asset
    setLocalEditMode(false);
  };

  const handleEditToggle = () => {
    setLocalEditMode(!localEditMode);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const InfoBadge = ({ icon, label, value, valueColor }) => (
    <View style={[styles.infoBadge, { backgroundColor: darkTheme ? '#2a2a3a' : '#EEF2FF' }]}>
      <View style={[styles.infoBadgeIcon, { backgroundColor: accentColor + '22' }]}>
        <Icon name={icon} size={16} color={accentColor} />
      </View>
      <View style={styles.infoBadgeText}>
        <Text style={[styles.infoBadgeLabel, { color: t.textSecondary || t.secondaryText }]}>{label}</Text>
        <Text style={[styles.infoBadgeValue, { color: valueColor || t.text }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <StatusBar barStyle={darkTheme ? 'light-content' : 'dark-content'} backgroundColor={t.background} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerIconBtn, { backgroundColor: t.cardBg }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={20} color={t.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: t.text }]}>
          {localEditMode ? 'Edit Profile' : 'Profile'}
        </Text>

        {!localEditMode ? (
          <TouchableOpacity
            onPress={handleEditToggle}
            style={[styles.headerIconBtn, { backgroundColor: t.cardBg }]}
          >
            <Icon name="edit" size={20} color={accentColor} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={[styles.headerIconBtn, { backgroundColor: accentColor + '22' }]}
          >
            {loading
              ? <ActivityIndicator size="small" color={accentColor} />
              : <Icon name="check" size={20} color={accentColor} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ─── KEY FIX: KAV wraps only ScrollView, behavior undefined on Android ─── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* ── Avatar Hero Card ── */}
          <View style={[styles.heroCard, { backgroundColor: t.cardBg }]}>
            {/* Decorative top strip */}
            <View style={[styles.heroStrip, { backgroundColor: accentColor }]} />

            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                onPress={localEditMode ? handleImagePicker : null}
                disabled={!localEditMode || imageLoading}
                activeOpacity={0.8}
              >
                {imageLoading ? (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: t.cardBg }]}>
                    <ActivityIndicator size="large" color={accentColor} />
                  </View>
                ) : localImage ? (
                  <Image source={{ uri: localImage }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: accentColor }]}>
                    <Text style={styles.avatarInitial}>
                      {localFullName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                {localEditMode && !imageLoading && (
                  <View style={[styles.cameraBadge, { backgroundColor: accentColor }]}>
                    <Icon name="camera-alt" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {!localEditMode && (
              <>
                <Text style={[styles.heroName, { color: t.text }]}>
                  {localFullName || 'User Name'}
                </Text>
                <Text style={[styles.heroUsername, { color: t.textSecondary || t.secondaryText }]}>
                  @{localUsername || 'username'}
                </Text>

                {/* Info Badges Row */}
                {user && (
                  <View style={styles.badgesRow}>
                    <InfoBadge
                      icon="calendar-today"
                      label="Member since"
                      value={formatDate(user?.createdAt)}
                    />
                    <InfoBadge
                      icon="verified-user"
                      label="Status"
                      value="Active"
                      valueColor={t.success || '#22C55E'}
                    />
                  </View>
                )}
              </>
            )}

            {localEditMode && (
              <Text style={[styles.editHint, { color: t.textSecondary || t.secondaryText }]}>
                Tap avatar to change photo
              </Text>
            )}
          </View>

          {/* ── Fields Card ── */}
          <View style={[styles.card, { backgroundColor: t.cardBg }]}>
            <Text style={[styles.cardLabel, { color: t.textSecondary || t.secondaryText }]}>
              ACCOUNT DETAILS
            </Text>

            {[
              { icon: 'person', label: 'Full Name', value: localFullName, setter: setLocalFullName, placeholder: 'Enter full name', keyboard: 'default', capitalize: 'words' },
              { icon: 'alternate-email', label: 'Username', value: localUsername, setter: setLocalUsername, placeholder: 'username', keyboard: 'default', capitalize: 'none', prefix: '@' },
              { icon: 'email', label: 'Email', value: localEmail, setter: setLocalEmail, placeholder: 'email@example.com', keyboard: 'email-address', capitalize: 'none' },
            ].map((field, index, arr) => (
              <View
                key={field.label}
                style={[
                  styles.fieldRow,
                  index < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border + '55' },
                ]}
              >
                <View style={[styles.fieldIconWrapper, { backgroundColor: darkTheme ? '#2a2a3a' : '#EEF2FF' }]}>
                  <Icon name={field.icon} size={18} color={accentColor} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: t.textSecondary || t.secondaryText }]}>
                    {field.label}
                  </Text>
                  {localEditMode ? (
                    <TextInput
                      style={[styles.fieldInput, { color: t.text, borderBottomColor: accentColor + '66' }]}
                      value={field.value}
                      onChangeText={field.setter}
                      placeholder={field.placeholder}
                      placeholderTextColor={t.textSecondary}
                      keyboardType={field.keyboard}
                      autoCapitalize={field.capitalize}
                    />
                  ) : (
                    <Text style={[styles.fieldValue, { color: t.text }]}>
                      {field.prefix}{field.value || '—'}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* ── Tips Card (edit mode only) ── */}
          {localEditMode && (
            <View style={[styles.card, { backgroundColor: t.cardBg }]}>
              <View style={styles.tipsHeader}>
                <Icon name="lightbulb" size={18} color="#F59E0B" />
                <Text style={[styles.cardLabel, { color: t.textSecondary || t.secondaryText, marginBottom: 0, marginLeft: 6 }]}>
                  TIPS
                </Text>
              </View>
              {[
                'Username: 3–20 characters, letters, numbers and underscores only.',
                'Email must be a valid address format.',
                'Tap the avatar to update your profile photo.',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: accentColor }]} />
                  <Text style={[styles.tipText, { color: t.textSecondary || t.secondaryText }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Action Buttons (edit mode only) ── */}
          {localEditMode && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: t.cardBg, borderColor: t.border }]}
                onPress={handleCancel}
              >
                <Icon name="close" size={18} color={t.text} style={{ marginRight: 6 }} />
                <Text style={[styles.cancelBtnText, { color: t.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: accentColor }, loading && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                    <Icon name="check" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  scrollContent: {
    padding: 16,
    paddingBottom: 48,  // ← generous bottom padding ensures last element is reachable
  },

  // Hero Card
  heroCard: {
    borderRadius: 20, alignItems: 'center',
    marginBottom: 14, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  heroStrip: { width: '100%', height: 56 },
  avatarWrapper: { marginTop: -40, marginBottom: 12 },
  avatar: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 4, borderColor: '#fff',
  },
  avatarPlaceholder: {
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 44, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  heroName: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  heroUsername: { fontSize: 14, marginBottom: 16 },
  editHint: { fontSize: 13, paddingBottom: 20, marginTop: -4 },

  // Info Badges
  badgesRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingBottom: 20, width: '100%',
  },
  infoBadge: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 10, borderRadius: 12,
  },
  infoBadgeIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  infoBadgeLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  infoBadgeValue: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  infoBadgeText: {},

  // Card
  card: {
    borderRadius: 20, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.1,
    marginBottom: 14,
  },

  // Field Row
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
  },
  fieldIconWrapper: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  fieldValue: { fontSize: 15, fontWeight: '500' },
  fieldInput: {
    fontSize: 15, paddingVertical: 4,
    borderBottomWidth: 1.5,
  },

  // Tips
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 1, height: 50, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default ProfileScreen;