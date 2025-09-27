import React, { useContext } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../src/context/ThemeContext';

const CustomModal = ({ visible, onClose, title, message, type = "error", children }) => {
  const { darkTheme } = useContext(ThemeContext);

  const iconName = type === "success" ? "checkmark-circle" : "alert-circle";

  // Background colors depending on theme
  const modalBg = darkTheme ? "#1E293B" : "#F8FAFC";
  const titleColor = darkTheme ? "#F1F5F9" : "#1E293B";
  const messageColor = darkTheme ? "#CBD5E1" : "#334155";
  const iconColor = darkTheme ? '#DC2626' : '#B91C1C' ;;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: modalBg }]}>
          <Icon name={iconName} size={48} color={iconColor} style={styles.icon} />
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.message, { color: messageColor }]}>{message}</Text>

          {/* Render children if passed, otherwise default OK button */}
          {children ? (
            children
          ) : (
            <TouchableOpacity style={styles.button} onPress={onClose}>
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
    shadowColor: '#000',
    shadowOpacity: 0.3,
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
    backgroundColor: '#2563EB',
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
