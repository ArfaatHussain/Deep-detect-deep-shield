import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, Switch, StyleSheet, Modal,
  TouchableOpacity, ActivityIndicator, ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { loadUser } from '../utils/loadUser';
import { deleteHistory } from '../service/userService';

const SettingsScreen = ({ navigation }) => {
  const { darkTheme, toggleTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [editedUsername, setEditedUsername] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh user data when returning from Profile screen
  // Replace your existing focus listener with this:
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // ✅ Check if Profile screen passed back updated data
      const updatedProfile = navigation.getState()
        ?.routes?.find(r => r.name === 'Settings')
        ?.params?.updatedProfile;

      if (updatedProfile) {
        setEditedFullName(updatedProfile.fullName || '');
        setEditedUsername(updatedProfile.username || '');
        setEditedEmail(updatedProfile.email || '');
        setAvatar(updatedProfile.avatar || null);
        // Clear the param so it doesn't re-apply
        navigation.setParams({ updatedProfile: null });
      } else {
        loadUserData(); // normal refresh
      }
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const userData = await loadUser();
      console.log('Loaded user data in Settings:', userData);
      setUser(userData);
      setEditedFullName(userData.fullName || userData.name || '');
      setEditedUsername(userData.username || '');
      setEditedEmail(userData.email || '');
      setAvatar(userData.avatar || null);
    } catch (error) {
      console.log('Error loading user:', error);
    }
  };

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

  const handleClearHistory = async () => {
    setLoading(true);
    try {
      const userData = await loadUser();
      const response = await deleteHistory(userData._id);
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

  const handleLogoutConfirm = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      navigation.replace('Login');
    } catch (error) {
      Toast.show('Failed to logout');
    }
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile', {
      user,
      editedFullName,
      editedUsername,
      editedEmail,
      avatar,
    });
  };


  const SettingItem = ({ icon, title, value, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: t.cardBg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <Icon name={icon} size={24} color={danger ? t.error : t.iconColor} />
        <Text style={[styles.settingItemText, { color: danger ? t.error : t.text }]}>{title}</Text>
      </View>
      <View style={styles.settingItemRight}>
        {value && <Text style={[styles.settingItemValue, { color: t.secondaryText }]}>{value}</Text>}
        {showArrow && <Icon name="chevron-right" size={24} color={t.iconColor} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.header, { borderBottomColor: t.headerBorder || t.border }]}>
        <Text style={[styles.headerTitle, { color: t.headerText || t.text }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity
          style={[styles.profileSection, { backgroundColor: t.cardBg }]}
          onPress={navigateToProfile}
          activeOpacity={0.7}
        >
          <View style={styles.profileImageContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.profileImage} />
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
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary || t.secondaryText }]}>Preferences</Text>
          <View style={[styles.settingItem, { backgroundColor: t.cardBg }]}>
            <View style={styles.settingItemLeft}>
              <Icon name={darkTheme ? 'nightlight-round' : 'wb-sunny'} size={24} color={t.iconColor} />
              <Text style={[styles.settingItemText, { color: t.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={darkTheme}
              onValueChange={handleThemeToggle}
              trackColor={{ false: t.switchTrackFalse || '#D1D5DB', true: t.switchTrackTrue || '#2563EB' }}
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
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <SettingItem
            icon="privacy-tip"
            title="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingItem
            icon="description"
            title="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: darkTheme ? t.cardBg : t.logoutBtnBg }]}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.7}
        >
          <Icon name="logout" size={24} color={t.logoutIconColor || t.error || '#a01616'} />
          <Text style={[styles.logoutText, { color: t.logoutIconColor || t.error || '#a01616' }]}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: t.textSecondary || t.secondaryText }]}>
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* Theme Change Modal (kept — it's just a brief toast-like confirmation) */}
      <Modal transparent visible={themeModalVisible} animationType="fade">
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

      {/* Delete Confirmation Modal (kept — it's a small confirmation dialog) */}
      <Modal transparent visible={deleteModalVisible} animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.deleteModalContent, { backgroundColor: t.background }]}>
            <Icon name="warning" size={50} color={t.error || '#a01616'} />
            <Text style={[styles.deleteModalTitle, { color: t.text }]}>Clear History</Text>
            <Text style={[styles.deleteModalText, { color: t.textSecondary || t.secondaryText }]}>
              Are you sure you want to delete all your history? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { borderColor: t.inputBorder || t.border,backgroundColor: t.logoutBtnBg  }]}
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
                {loading ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <Text style={styles.confirmButtonText}>Clear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal (kept — it's a small confirmation dialog) */}
      <Modal transparent visible={logoutModalVisible} animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={[styles.centeredModalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.logoutModalContent, { backgroundColor: t.background }]}>
            <Text style={[styles.logoutModalTitle, { color: t.text }]}>Logout</Text>
            <Text style={[styles.logoutModalText, { color: t.textSecondary || t.secondaryText }]}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={[styles.logoutCancelButton, { borderColor: t.inputBorder || t.border, backgroundColor: t.logoutBtnBg }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.logoutCancelButtonText, { color: darkTheme ? '#FFF' : '#000' }]}>Cancel</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  profileSection: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    marginHorizontal: 20, marginVertical: 15, borderRadius: 15,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  profileImageContainer: { position: 'relative', marginRight: 15 },
  profileImage: { width: 60, height: 60, borderRadius: 30 },
  profileImagePlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  profileImageText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', textTransform: 'uppercase',
    marginLeft: 20, marginBottom: 8, letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 20,
    marginHorizontal: 20, marginBottom: 2, borderRadius: 12,
  },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingItemText: { fontSize: 16, marginLeft: 12, flex: 1 },
  settingItemRight: { flexDirection: 'row', alignItems: 'center' },
  settingItemValue: { fontSize: 14, marginRight: 8 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 15, marginHorizontal: 20, marginTop: 10, borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '600', marginLeft: 10 },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: 20, marginBottom: 30 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  themeModalContent: { padding: 30, borderRadius: 20, alignItems: 'center', width: '80%', elevation: 5 },
  themeModalText: { fontSize: 20, fontWeight: '600', marginTop: 15, marginBottom: 5 },
  themeModalSubtext: { fontSize: 14 },
  deleteModalContent: { padding: 25, borderRadius: 20, alignItems: 'center', width: '85%' },
  deleteModalTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  deleteModalText: { fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  deleteModalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  deleteModalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { borderWidth: 1, backgroundColor: 'transparent' },
  confirmButton: { backgroundColor: '#a01616' },
  deleteModalButtonText: { fontSize: 16, fontWeight: '600' },
  confirmButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  centeredModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoutModalContent: {
    width: '85%', maxWidth: 340, borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  logoutModalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  logoutModalText: { fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  logoutModalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  logoutCancelButton: { flex: 1, height: 50, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  logoutCancelButtonText: { fontSize: 16, fontWeight: '600' },
  logoutConfirmButton: { flex: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoutConfirmButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default SettingsScreen;