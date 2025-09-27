import React, { useContext, useState } from 'react';
import { View, Text, Switch, StyleSheet, Modal } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const SettingsScreen = () => {
  const { darkTheme, toggleTheme } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);

  const handleThemeToggle = () => {
    toggleTheme();
    setModalVisible(true);
    setTimeout(() => setModalVisible(false), 700);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkTheme ? '#0F172A' : '#F9FAFB' },
      ]}>
      <Text
        style={[styles.header, { color: darkTheme ? '#F1F5F9' : '#0F172A' }]}>
        Settings
      </Text>

      <View style={styles.settingItem}>
        <Text
          style={[styles.text, { color: darkTheme ? '#F1F5F9' : '#0F172A' }]}>
          {darkTheme ? 'Enable Light Theme ☀️' : 'Enable Dark Theme 🌙'}
        </Text>
        <Switch
          value={darkTheme}
          onValueChange={handleThemeToggle}
          trackColor={{ false: '#94A3B8', true: '#2563EB' }}
          thumbColor={darkTheme ? '#60A5FA' : '#E5E7EB'}
        />
      </View>

      {/* Modal Confirmation */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: darkTheme ? '#1E293B' : '#FFFFFF',
                borderColor: darkTheme ? '#334155' : '#CBD5E1', 
              },
            ]}>
            <Text
              style={[
                styles.modalText,
                { color: darkTheme ? '#F1F5F9' : '#0F172A' },
              ]}>
              {darkTheme ? 'Dark Mode Enabled 🌙' : 'Light Mode Enabled ☀️'}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  text: { fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    elevation: 6,
    borderWidth: 1, 
  },
  modalText: { fontSize: 18, fontWeight: '600' },
});

export default SettingsScreen;
