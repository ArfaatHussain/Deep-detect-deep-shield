import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  ActivityIndicator, ScrollView, StatusBar, KeyboardAvoidingView,
  Platform, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { updateUser } from '../service/userService';
import { resendOTP, verifyOTP } from '../service/AuthService';
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
  const [localImageAsset, setLocalImageAsset] = useState(null);

  // ─── OTP Modal State ───────────────────────────────────────────────────────
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // ─── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!otpModalVisible) return;
    if (countdown === 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, otpModalVisible]);

  // ─── Image Picker ──────────────────────────────────────────────────────────
  const handleImagePicker = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: false, maxHeight: 500, maxWidth: 500, quality: 0.8 },
      (response) => {
        if (response.didCancel) return;
        if (response.error) { Toast.show('Failed to pick image'); return; }
        const asset = response.assets[0];
        setLocalImage(asset.uri);
        setLocalImageAsset(asset);
      }
    );
  };

  // ─── Step 1: Request OTP then show modal ──────────────────────────────────
  const handleSavePress = async () => {
    if (!localFullName || !localUsername || !localEmail) {
      Toast.show('Please fill all fields');
      return;
    }

    try {
      setSendingOtp(true);
      // Request OTP for profile change
      await resendOTP(localEmail, 'profile_change');

      // Reset OTP modal state
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      setOtpModalVisible(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send verification code';
      Toast.show(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // ─── OTP input handlers ────────────────────────────────────────────────────
  const handleOtpChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;
    const newOtp = [...otp];

    if (text.length > 1) {
      // Handle paste
      const digits = text.replace(/\D/g, '').slice(0, 6).split('');
      const filled = [...otp];
      digits.forEach((d, i) => { if (i < 6) filled[i] = d; });
      setOtp(filled);
      inputRefs.current[5]?.focus();
      return;
    }

    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ─── Step 2: Verify OTP then save profile ─────────────────────────────────
  const handleVerifyAndSave = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Toast.show('Please enter the 6-digit code');
      return;
    }

    try {
      setOtpLoading(true);

      // Verify OTP
      await verifyOTP({
        email: localEmail,
        otp: otpString,
        purpose: 'profile_change',
      });

      // OTP valid — now save profile
      const formData = new FormData();
      formData.append('fullName', localFullName);
      formData.append('username', localUsername);
      formData.append('email', localEmail);

      if (localImageAsset) {
        formData.append('avatar', {
          uri: localImageAsset.uri,
          type: localImageAsset.type || 'image/jpeg',
          name: localImageAsset.fileName || 'profile.jpg',
        });
      }

      const response = await updateUser(user._id, formData);

      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
      setOtpModalVisible(false);
      setLocalEditMode(false);
      setLocalImageAsset(null);
      Toast.show('Profile updated successfully');

      navigation.navigate('Settings', {
        updatedProfile: {
          fullName: response.data.data.fullName,
          username: response.data.data.username,
          email: response.data.data.email,
          avatar: response.data.data.avatar,
        },
      });
    } catch (error) {
      console.error("Error: ",error)
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    try {
      setSendingOtp(true);
      await resendOTP(localEmail, 'profile_change');
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      Toast.show('A new code has been sent');
    } catch (error) {
      Toast.show('Failed to resend code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleCancel = () => {
    setLocalFullName(editedFullName);
    setLocalUsername(editedUsername);
    setLocalEmail(editedEmail);
    setLocalImage(initialImage);
    setLocalImageAsset(null);
    setLocalEditMode(false);
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
            onPress={() => setLocalEditMode(true)}
            style={[styles.headerIconBtn, { backgroundColor: t.cardBg }]}
          >
            <Icon name="edit" size={20} color={accentColor} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSavePress}
            disabled={sendingOtp}
            style={[styles.headerIconBtn, { backgroundColor: accentColor + '22' }]}
          >
            {sendingOtp
              ? <ActivityIndicator size="small" color={accentColor} />
              : <Icon name="check" size={20} color={accentColor} />
            }
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: t.cardBg }]}>

            {/* Close */}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setOtpModalVisible(false)}
            >
              <Icon name="close" size={22} color={t.text} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={[styles.modalIconCircle, { backgroundColor: accentColor + '22' }]}>
              <Icon name="verified-user" size={36} color={accentColor} />
            </View>

            <Text style={[styles.modalTitle, { color: t.text }]}>Verify your identity</Text>
            <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>
              We sent a 6-digit code to
            </Text>
            <Text style={[styles.modalEmail, { color: accentColor }]}>{localEmail}</Text>

            {/* OTP Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: t.inputBg || (darkTheme ? '#1a1a2e' : '#f9fafb'),
                      borderColor: digit ? accentColor : t.inputBorder || '#e5e7eb',
                      color: t.text,
                    },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: otpLoading ? accentColor + '88' : accentColor }]}
              onPress={handleVerifyAndSave}
              disabled={otpLoading}
            >
              {otpLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.verifyBtnText}>Verify & Save Changes</Text>
              }
            </TouchableOpacity>

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: t.textSecondary }]}>
                Didn't receive it?{' '}
              </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={sendingOtp}>
                  <Text style={[styles.resendLink, { color: accentColor }]}>
                    {sendingOtp ? 'Sending...' : 'Resend'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.resendTimer, { color: t.textSecondary }]}>
                  Resend in {countdown}s
                </Text>
              )}
            </View>

          </View>
        </View>
      </Modal>

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
          {/* Hero Card */}
          <View style={[styles.heroCard, { backgroundColor: t.cardBg }]}>
            <View style={[styles.heroStrip]} />
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
                <Text style={[styles.heroName, { color: t.text }]}>{localFullName || 'User Name'}</Text>
                <Text style={[styles.heroUsername, { color: t.textSecondary || t.secondaryText }]}>
                  @{localUsername || 'username'}
                </Text>
                {user && (
                  <View style={styles.badgesRow}>
                    <InfoBadge icon="calendar-today" label="Member since" value={formatDate(user?.createdAt)} />
                    <InfoBadge icon="verified-user" label="Status" value="Active" valueColor={t.success || '#22C55E'} />
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

          {/* Fields Card */}
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
                  <Text style={[styles.fieldLabel, { color: t.textSecondary || t.secondaryText }]}>{field.label}</Text>
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
                    <Text style={[styles.fieldValue, { color: t.text }]}>{field.prefix}{field.value || '—'}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Tips Card */}
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
                'An OTP will be sent to verify your changes before saving.',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: accentColor }]} />
                  <Text style={[styles.tipText, { color: t.textSecondary || t.secondaryText }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
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
                style={[styles.saveBtn, { backgroundColor: accentColor }, sendingOtp && { opacity: 0.6 }]}
                onPress={handleSavePress}
                disabled={sendingOtp}
              >
                {sendingOtp
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 48 },
  heroCard: {
    borderRadius: 20, alignItems: 'center', marginBottom: 14, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  heroStrip: { width: '100%', height: 56 },
  avatarWrapper: { marginTop: -40, marginBottom: 12 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
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
  badgesRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 20, width: '100%' },
  infoBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12 },
  infoBadgeIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoBadgeLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  infoBadgeValue: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  infoBadgeText: {},
  card: {
    borderRadius: 20, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 14 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  fieldIconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  fieldValue: { fontSize: 15, fontWeight: '500' },
  fieldInput: { fontSize: 15, paddingVertical: 4, borderBottomWidth: 1.5 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
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

  // ── OTP Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20, 
  },
  modalCard: {
    borderRadius: 28,
    padding: 28, alignItems: 'center',
  },
  modalClose: { position: 'absolute', top: 20, right: 20 },
  modalIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, textAlign: 'center' },
  modalEmail: { fontSize: 14, fontWeight: '600', marginBottom: 28 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  otpBox: {
    width: 46, height: 54, borderRadius: 12,
    borderWidth: 2, fontSize: 22, fontWeight: '700',
  },
  verifyBtn: {
    width: '100%', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendText: { fontSize: 14 },
  resendLink: { fontSize: 14, fontWeight: '600' },
  resendTimer: { fontSize: 14 },
});

export default ProfileScreen;