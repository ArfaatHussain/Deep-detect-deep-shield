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
  const t = getTheme(darkTheme);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header - Updated to match Privacy Policy style */}
      <View style={[styles.header, { backgroundColor: t.background, borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          style={[styles.backButton, { backgroundColor: t.cardBg }]}
        >
          <Icon name="arrow-back" size={20} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.text }]}>Tamper-Proof Media</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // New header styles matching Privacy Policy
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  // Rest of the styles remain exactly the same
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
    marginTop: 20,
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