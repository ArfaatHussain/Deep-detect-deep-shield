import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const accentColor = t.button || '#2563EB';

  const sections = [
    {
      icon: 'collect-savings',
      title: 'Information We Collect',
      body: 'We collect information you provide directly to us, such as when you create an account, update your profile, or contact us for support. This may include your name, email address, and profile information.',
    },
    {
      icon: 'tune',
      title: 'How We Use Your Information',
      body: 'We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience.',
    },
    {
      icon: 'lock',
      title: 'Data Security',
      body: 'We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access.',
    },
    {
      icon: 'share',
      title: 'Data Sharing',
      body: 'We do not sell your personal information to third parties. We may share data with trusted service providers who assist us in operating our app under strict confidentiality agreements.',
    },
    {
      icon: 'person-off',
      title: 'Your Rights',
      body: 'You have the right to access, correct, or delete your personal data at any time. You may also request a copy of the data we hold about you by contacting our support team.',
    },
    {
      icon: 'mail-outline',
      title: 'Contact Us',
      body: 'If you have any questions about this Privacy Policy, please contact us at privacy@yourapp.com. We aim to respond within 48 hours.',
    },
  ];

  const highlights = [
    { icon: 'no-encryption-gae', label: 'No Data Selling' },
    { icon: 'security', label: 'Encrypted Storage' },
    { icon: 'visibility-off', label: 'Private by Default' },
  ];

  const toggleSection = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
        <Text style={[styles.headerTitle, { color: t.text }]}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: accentColor }]}>
          <View style={styles.heroIconWrapper}>
            <Icon name="privacy-tip" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>
            We are committed to protecting your personal data and being transparent about how we use it.
          </Text>
          <View style={styles.heroBadge}>
            <Icon name="event" size={13} color={accentColor} />
            <Text style={[styles.heroBadgeText, { color: accentColor }]}>
              Last updated: March 2026
            </Text>
          </View>
        </View>

        {/* Highlight Pills Row */}
        <View style={styles.highlightsRow}>
          {highlights.map((item, i) => (
            <View key={i} style={[styles.highlightPill, { backgroundColor: t.cardBg }]}>
              <Icon name={item.icon} size={16} color={accentColor} />
              <Text style={[styles.highlightLabel, { color: t.text }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: t.cardBg }]}>
          <Icon name="info-outline" size={20} color={accentColor} />
          <Text style={[styles.introText, { color: t.textSecondary || t.secondaryText }]}>
            This policy explains what data we collect, why we collect it, and how you can control it. Tap any section to read more.
          </Text>
        </View>

        {/* Section Label */}
        <Text style={[styles.sectionGroupLabel, { color: t.textSecondary || t.secondaryText }]}>
          POLICY DETAILS
        </Text>

        {/* Accordion Sections */}
        {sections.map((section, index) => {
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
                  <Icon name={section.icon} size={18} color={isExpanded ? '#fff' : accentColor} />
                </View>
                <Text style={[styles.accordionTitle, { color: t.text }]} numberOfLines={1}>
                  {section.title}
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
                    {section.body}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Footer Contact Card */}
        <View style={[styles.footerCard, { backgroundColor: t.cardBg }]}>
          <View style={[styles.footerIconWrapper, { backgroundColor: darkTheme ? '#2a2a3a' : '#EEF2FF' }]}>
            <Icon name="support-agent" size={24} color={accentColor} />
          </View>
          <View style={styles.footerCardText}>
            <Text style={[styles.footerCardTitle, { color: t.text }]}>Privacy Questions?</Text>
            <Text style={[styles.footerCardSubtitle, { color: t.textSecondary || t.secondaryText }]}>
              privacy@yourapp.com
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.footerCardButton, { backgroundColor: accentColor }]}
            onPress={() => Linking.openURL('mailto:privacy@yourapp.com')}
          >
            <Text style={styles.footerCardButtonText}>Email Us</Text>
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

  // Highlights Row
  highlightsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 20, marginTop: 16, gap: 8,
  },
  highlightPill: {
    flex: 1, flexDirection: 'column', alignItems: 'center',
    paddingVertical: 12, borderRadius: 14, gap: 6,
  },
  highlightLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

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

export default PrivacyPolicyScreen;