import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { loadUser } from '../utils/loadUser';
import { updateUser } from '../service/userService';

const ChangePasswordScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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
    switch (strength) {
      case 1: return 'Weak';
      case 2: return 'Medium';
      case 3: return 'Strong';
      default: return 'Very weak';
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 1: return t.error || '#FF3B30';
      case 2: return t.warning || '#FFA500';
      case 3: return t.success || '#4CD964';
      default: return t.error || '#FF3B30';
    }
  };

  const isPasswordValid =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!currentPassword) { Toast.show('Current password is required'); return; }
    if (!newPassword) { Toast.show('New password is required'); return; }
    if (!confirmPassword) { Toast.show('Please confirm your new password'); return; }
    if (newPassword.length < 6) { Toast.show('New password must be at least 6 characters long'); return; }
    if (newPassword !== confirmPassword) { Toast.show('New passwords do not match'); return; }

    setPasswordLoading(true);
    try {
      const userData = await loadUser();
      await updateUser(userData._id, { oldPassword: currentPassword, newPassword });
      Toast.show('Password changed successfully', Toast.SHORT);
      navigation.goBack();
    } catch (error) {
      Toast.show(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.headerBorder || t.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={t.headerText || t.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.headerText || t.text }]}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Requirements Card */}
        <View style={[styles.requirementsCard, { backgroundColor: t.cardBg }]}>
          <Icon name="info" size={20} color={t.iconColor} />
          <Text style={[styles.requirementsText, { color: t.descriptionText || t.textSecondary }]}>
            Password must be at least 6 characters long with at least one number and one letter
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: t.labelText || t.text }]}>Current Password</Text>
          <View style={[styles.inputWrapper, { borderColor: t.inputBorder || t.border, backgroundColor: t.cardBg }]}>
            <Icon name="lock" size={20} color={t.iconColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: t.text }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={t.placeholder || t.textSecondary}
              secureTextEntry={!showCurrentPassword}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.visibilityToggle}>
              <Icon name={showCurrentPassword ? 'visibility' : 'visibility-off'} size={24} color={t.iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: t.labelText || t.text }]}>New Password</Text>
          <View style={[styles.inputWrapper, { borderColor: t.inputBorder || t.border, backgroundColor: t.cardBg }]}>
            <Icon name="vpn-key" size={20} color={t.iconColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: t.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={t.placeholder || t.textSecondary}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.visibilityToggle}>
              <Icon name={showNewPassword ? 'visibility' : 'visibility-off'} size={24} color={t.iconColor} />
            </TouchableOpacity>
          </View>
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3].map((level) => (
                  <View
                    key={level}
                    style={[styles.strengthBar, {
                      backgroundColor: newPassword.length >= 6 &&
                        level <= calculatePasswordStrength(newPassword)
                        ? getStrengthColor(calculatePasswordStrength(newPassword))
                        : (t.inputBorder || t.border)
                    }]}
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
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: t.labelText || t.text }]}>Confirm Password</Text>
          <View style={[styles.inputWrapper, {
            borderColor: confirmPassword && newPassword !== confirmPassword
              ? (t.error || '#FF3B30') : (t.inputBorder || t.border),
            backgroundColor: t.cardBg,
          }]}>
            <Icon name="lock" size={20} color={t.iconColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: t.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={t.placeholder || t.textSecondary}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.visibilityToggle}>
              <Icon name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={24} color={t.iconColor} />
            </TouchableOpacity>
          </View>
          {confirmPassword && newPassword !== confirmPassword && (
            <Text style={[styles.errorText, { color: t.error || '#FF3B30' }]}>Passwords do not match</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: t.button || '#2563EB' },
            (!isPasswordValid || passwordLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={!isPasswordValid || passwordLoading}
        >
          {passwordLoading
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Text style={styles.submitButtonText}>Update Password</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  requirementsCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 10, marginBottom: 24, gap: 10,
  },
  requirementsText: { flex: 1, fontSize: 13, lineHeight: 18 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16 },
  visibilityToggle: { padding: 8 },
  strengthContainer: {
    marginTop: 8, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 12, marginLeft: 10 },
  errorText: { fontSize: 12, marginTop: 5 },
  submitButton: {
    height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginTop: 10, elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default ChangePasswordScreen;