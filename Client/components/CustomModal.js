import React, { useContext } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../src/context/ThemeContext';
import { getTheme } from '../src/context/theme';

const CustomModal = ({ visible, onClose, title, message, type = "error", children }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const iconName = type === "success" ? "checkmark-circle" : "alert-circle";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: t.modalBg,
              borderColor: t.modalBorder,
              shadowOpacity: t.modalShadowOpacity,
            },
          ]}
        >
          <Icon
            name={iconName}
            size={48}
            color={t.logoutIconColor}
            style={styles.icon}
          />

          <Text style={[styles.title, { color: t.modalText }]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: t.secondaryText || t.textSecondary }]}>
            {message}
          </Text>

          {/* Render children if passed, otherwise default OK button */}
          {children ? (
            children
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: t.button || '#2563EB' }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomModal;
