import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';

const HelpSupportScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);

  const handleContactSupport = () => {
    const subject = 'Support Request';
    const body = 'Please describe your issue here:';
    const mailtoUrl = `mailto:support@yourapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl).catch(() => Toast.show('Could not open email client', Toast.SHORT));
  };

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Account > Change Password. Enter your current password and then your new password.',
    },
    {
      question: 'How do I clear my history?',
      answer: 'Navigate to Settings > Data Management > Clear History to remove all your search history.',
    },
    {
      question: 'How do I update my profile?',
      answer: 'Tap on your profile picture at the top of Settings to edit your profile information.',
    },
    {
      question: 'How do I change the theme?',
      answer: 'Go to Settings > Preferences and toggle the Dark Mode switch.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.header, { borderBottomColor: t.headerBorder || t.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={t.headerText || t.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.headerText || t.text }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Frequently Asked Questions</Text>

        {faqs.map((faq, index) => (
          <View key={index} style={[styles.faqItem, { backgroundColor: t.cardBg }]}>
            <Text style={[styles.faqQuestion, { color: t.text }]}>• {faq.question}</Text>
            <Text style={[styles.faqAnswer, { color: t.textSecondary || t.secondaryText }]}>{faq.answer}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: t.button || '#2563EB' }]}
          onPress={handleContactSupport}
        >
          <Icon name="email" size={20} color="#FFF" />
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  faqItem: { padding: 16, borderRadius: 12, marginBottom: 12 },
  faqQuestion: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  faqAnswer: { fontSize: 14, lineHeight: 20 },
  contactButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 12, marginTop: 10, gap: 10,
  },
  contactButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default HelpSupportScreen;