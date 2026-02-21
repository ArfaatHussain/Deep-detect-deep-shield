import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';

const TamperProof = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t =getTheme(darkTheme);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Back Icon */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: t.cardBg }]}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Icon name="arrow-back" size={24} color={t.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: t.textPrimary }]}>
        Tamper-Proof Media
      </Text>

      {/* Options: Protect or Verify */}
      <View style={styles.optionsContainer}>
        {/* Protect Image */}
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          onPress={() => navigation.navigate('ProtectScreen')}
        >
          <Icon name="shield-checkmark-outline" size={40} color={t.iconColor} />
          <Text style={[styles.optionText, { color: t.textPrimary }]}>
            Protect Image
          </Text>
        </TouchableOpacity>

        {/* Verify Image */}
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}
          onPress={() => navigation.navigate('VerifyScreen')}
        >
          <Icon name="checkmark-done-outline" size={40} color={t.iconColor} />
          <Text style={[styles.optionText, { color: t.textPrimary }]}>
            Verify Image
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={[styles.infoContainer, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <Text style={[styles.infoTitle, { color: t.textPrimary }]}>
          What this module will do:
        </Text>
        <Text style={[styles.infoText, { color: t.textSecondary }]}>
          • Embed digital watermarks{'\n'}
          • Add secure metadata{'\n'}
          • Prevent unauthorized editing{'\n'}
          • Provide tamper detection
        </Text>
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 80,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    transition: 'all 0.2s',
  },
  optionText: { fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  infoContainer: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoText: { fontSize: 14, lineHeight: 22 },
});

export default TamperProof;
