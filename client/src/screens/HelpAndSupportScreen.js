import React, { useContext, useState } from 'react';
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
  const [expandedIndex, setExpandedIndex] = useState(null);

  const accentColor = t.button || '#2563EB';

  const faqs = [
    {
      icon: 'lock-reset',
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Account > Change Password. Enter your current password and then your new password.',
    },
    {
      icon: 'delete-sweep',
      question: 'How do I clear my history?',
      answer: 'Navigate to Settings > Data Management > Clear History to remove all your search history.',
    },
    {
      icon: 'edit',
      question: 'How do I update my profile?',
      answer: 'Tap on your profile picture at the top of Settings to edit your profile information.',
    },
    {
      icon: 'dark-mode',
      question: 'How do I change the theme?',
      answer: 'Go to Settings > Preferences and toggle the Dark Mode switch.',
    },
    {
      icon: 'notifications',
      question: 'How do I manage notifications?',
      answer: 'Go to Settings > Notifications to customize which alerts you receive.',
    },
    {
      icon: 'backup',
      question: 'How do I backup my data?',
      answer: 'Go to Settings > Data Management > Backup to create a secure backup of your data.',
    },
  ];

  const toggleSection = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    const subject = 'Support Request';
    const body = 'Please describe your issue here:';
    const mailtoUrl = `mailto:support@yourapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl).catch(() => Toast.show('Could not open email client', Toast.SHORT));
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.background, borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: t.cardBg }]}
        >
          <Icon name="arrow-back" size={20} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.text }]}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: accentColor }]}>
          <View style={styles.heroIconWrapper}>
            <Icon name="support-agent" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>How Can We Help?</Text>
          <Text style={styles.heroSubtitle}>
            Get answers to common questions or reach out to our support team for personalized assistance.
          </Text>
          <View style={styles.heroBadge}>
            <Icon name="schedule" size={13} color={accentColor} />
            <Text style={[styles.heroBadgeText, { color: accentColor }]}>
              Response within 24 hours
            </Text>
          </View>
        </View>

        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: t.cardBg }]}>
          <Icon name="info-outline" size={20} color={accentColor} />
          <Text style={[styles.introText, { color: t.textSecondary || t.secondaryText }]}>
            Browse our frequently asked questions below. If you can't find what you're looking for, contact our support team directly.
          </Text>
        </View>

        {/* Section Label */}
        <Text style={[styles.sectionGroupLabel, { color: t.textSecondary || t.secondaryText }]}>
          FREQUENTLY ASKED QUESTIONS
        </Text>

        {/* Accordion Sections */}
        {faqs.map((faq, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              onPress={() => toggleSection(index)}
              style={[
                styles.accordionCard,
                { backgroundColor: t.cardBg },
                isExpanded && { borderColor: accentColor, borderWidth: 1.5 },
              ]}
            >
              <View style={styles.accordionHeader}>
                <View style={[
                  styles.iconCircle,
                  { backgroundColor: isExpanded ? accentColor : (darkTheme ? '#2a2a3a' : '#EEF2FF') },
                ]}>
                  <Icon name={faq.icon} size={18} color={isExpanded ? '#fff' : accentColor} />
                </View>
                <Text style={[styles.accordionTitle, { color: t.text }]} numberOfLines={1}>
                  {faq.question}
                </Text>
                <View style={[styles.chevronWrapper, { backgroundColor: darkTheme ? '#2a2a3a' : '#F3F4F6' }]}>
                  <Icon
                    name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color={t.textSecondary || t.secondaryText}
                  />
                </View>
              </View>

              {isExpanded && (
                <View style={[styles.accordionBody, { borderTopColor: t.border }]}>
                  <Text style={[styles.accordionBodyText, { color: t.textSecondary || t.secondaryText }]}>
                    {faq.answer}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Footer Contact Card */}
        <View style={[styles.footerCard, { backgroundColor: t.cardBg }]}>
          <View style={[styles.footerIconWrapper, { backgroundColor: darkTheme ? '#2a2a3a' : '#EEF2FF' }]}>
            <Icon name="headset-mic" size={24} color={accentColor} />
          </View>
          <View style={styles.footerCardText}>
            <Text style={[styles.footerCardTitle, { color: t.text }]}>Still Need Help?</Text>
            <Text style={[styles.footerCardSubtitle, { color: t.textSecondary || t.secondaryText }]}>
              Our support team is here for you
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.footerCardButton, { backgroundColor: accentColor }]}
            onPress={handleEmailSupport}
          >
            <Text style={styles.footerCardButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  scrollContent: { paddingBottom: 50 },

  // Hero Banner
  heroBanner: {
    marginHorizontal: 20, marginTop: 20, borderRadius: 20,
    padding: 24, alignItems: 'center',
  },
  heroIconWrapper: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', lineHeight: 20, marginBottom: 14,
    paddingHorizontal: 10,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600' },

  // Intro Card
  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 20, marginTop: 14, borderRadius: 14, padding: 14,
  },
  introText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // Section Group Label
  sectionGroupLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginHorizontal: 20, marginTop: 24, marginBottom: 10,
  },

  // Accordion
  accordionCard: {
    marginHorizontal: 20, marginBottom: 10,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  iconCircle: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  accordionTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  chevronWrapper: {
    width: 30, height: 30, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  accordionBody: {
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, borderTopWidth: 1,
  },
  accordionBodyText: { fontSize: 14, lineHeight: 22 },

  // Footer Card
  footerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 16,
  },
  footerIconWrapper: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  footerCardText: { flex: 1 },
  footerCardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  footerCardSubtitle: { fontSize: 12 },
  footerCardButton: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  footerCardButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default HelpSupportScreen;