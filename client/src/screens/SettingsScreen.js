import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-simple-toast';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { loadUser } from '../utils/loadUser';
import { API_URL } from '../../config';

const SettingsScreen = () => {
  const { darkTheme, toggleTheme } = useContext(ThemeContext);

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false); // new loading state

  const t = getTheme(darkTheme);

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
    setLoading(true); // start loading
    try {
      const user = await loadUser();
      const response = await axios.delete(`${API_URL}/user/${user._id}/history`);

      setLoading(false); // stop loading
      setDeleteModalVisible(false);

      if (response.data.success) {
        Toast.show('History deleted successfully');
      } else {
        Toast.show(response.data.message || 'No history found');
      }
    } catch (error) {
      console.error(error);
      setLoading(false); // stop loading
      Alert.alert('Error', 'Failed to delete history');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Text style={[styles.header, { color: t.headerText }]}>
        Settings
      </Text>

      {/* ================= THEME TOGGLE ================= */}
      <View
        style={[
          styles.settingItem,
          {
            backgroundColor: t.cardBg,
            borderBottomColor: t.cardBorder,
            shadowOpacity: t.cardShadowOpacity,
          },
        ]}
      >
        <Text style={[styles.text, { color: t.text }]}>
          {darkTheme ? 'Enable Light Theme ☀️' : 'Enable Dark Theme 🌙'}
        </Text>

        <Switch
          value={darkTheme}
          onValueChange={handleThemeToggle}
          trackColor={{
            false: t.switchTrackFalse,
            true: t.switchTrackTrue,
          }}
          thumbColor={t.switchThumb}
        />
      </View>

      {/* ================= CLEAR HISTORY ================= */}
      <TouchableOpacity
        style={[
          styles.settingItem,
          {
            backgroundColor: t.cardBg,
            borderBottomColor: t.cardBorder,
            shadowOpacity: t.cardShadowOpacity,
          },
        ]}
        onPress={() => setDeleteModalVisible(true)}
      >
        <Text style={[styles.text, { color: t.text }]}>
          Delete History
        </Text>
      </TouchableOpacity>

      {/* ================= APP VERSION ================= */}
      <View
        style={[
          styles.settingItem,
          {
            backgroundColor: t.cardBg,
            borderBottomColor: t.cardBorder,
            shadowOpacity: t.cardShadowOpacity,
          },
        ]}
      >
        <Text style={[styles.text, { color: t.text }]}>
          App Version: 1.0.0
        </Text>
      </View>

      {/* ================= THEME MODAL ================= */}
      <Modal
        transparent
        visible={themeModalVisible}
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: t.modalBg,
                borderColor: t.modalBorder,
                shadowOpacity: t.modalShadowOpacity,
              },
            ]}
          >
            <Text style={[styles.modalText, { color: t.modalText }]}>
              {darkTheme ? 'Dark Mode Enabled 🌙' : 'Light Mode Enabled ☀️'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: t.modalBg,
                borderColor: t.modalBorder,
                shadowOpacity: t.modalShadowOpacity,
              },
            ]}
          >
            <Text
              style={[styles.modalText, { color: t.modalText, marginBottom: 20 }]}
            >
              Are you sure you want to delete all history?
            </Text>

            <TouchableOpacity
              style={{ paddingVertical: 10 }}
              onPress={handleClearHistory}
              disabled={loading} // disable while loading
            >
              <Text
                style={[styles.modalText, { color: 'red', fontWeight: '600' }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="red" />
                ) : (
                  'Delete History'
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 10 }}
              onPress={() => setDeleteModalVisible(false)}
              disabled={loading}
            >
              <Text style={[styles.modalText, { color: t.modalText }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },

  text: {
    fontSize: 18,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    width: '80%',
  },

  modalText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SettingsScreen;
