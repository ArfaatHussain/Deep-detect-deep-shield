import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';

const TermsOfServiceScreen = ({ navigation }) => {
  const { darkTheme } = useContext(ThemeContext);
  const t = getTheme(darkTheme);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const accentColor = t.button || '#2563EB';

  const sections = [
    {
      icon: 'check-circle',
      title: 'Acceptance of Terms',
      body: 'By accessing or using our app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.',
    },
    {
      icon: 'manage-accounts',
      title: 'User Accounts',
      body: 'You are responsible for maintaining the security of your account. You must notify us immediately of any unauthorized use of your account.',
    },
    {
      icon: 'shield',
      title: 'User Conduct',
      body: 'You agree not to use the app for any unlawful purpose or to violate any laws. You are solely responsible for your conduct while using our services.',
    },
    {
      icon: 'cancel',
      title: 'Termination',
      body: 'We reserve the right to suspend or terminate your account at any time for violations of these terms.',
    },
    {
      icon: 'update',
      title: 'Changes to Terms',
      body: 'We may modify these terms at any time. We will notify you of any changes by posting the new terms on this page.',
    },
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
        <Text style={[styles.headerTitle, { color: t.text }]}>Terms of Service</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: accentColor }]}>
          <View style={styles.heroIconWrapper}>
            <Icon name="gavel" size={36} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Our Terms</Text>
          <Text style={styles.heroSubtitle}>
            Please read these terms carefully before using our services.
          </Text>
          <View style={styles.heroBadge}>
            <Icon name="verified" size={14} color={accentColor} />
            <Text style={[styles.heroBadgeText, { color: accentColor }]}>
              Last updated: March 2026 · v1.0.0
            </Text>
          </View>
        </View>

        {/* Intro Card */}
        <View style={[styles.introCard, { backgroundColor: t.cardBg }]}>
          <Icon name="info-outline" size={20} color={accentColor} />
          <Text style={[styles.introText, { color: t.textSecondary || t.secondaryText }]}>
            By using our app, you acknowledge that you have read and understood these terms. Tap any section to expand it.
          </Text>
        </View>

        {/* Accordion Sections */}
        <Text style={[styles.sectionGroupLabel, { color: t.textSecondary || t.secondaryText }]}>
          TERMS & CONDITIONS
        </Text>

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
              {/* Card Header Row */}
              <View style={styles.accordionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: isExpanded ? accentColor : (darkTheme ? '#2a2a3a' : '#EEF2FF') }]}>
                  <Icon
                    name={section.icon}
                    size={18}
                    color={isExpanded ? '#fff' : accentColor}
                  />
                </View>
                <View style={styles.accordionTitleWrapper}>
                  <Text style={[styles.accordionNumber, { color: accentColor }]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.accordionTitle, { color: t.text }]}>
                    {section.title}
                  </Text>
                </View>
                <View style={[
                  styles.chevronWrapper,
                  { backgroundColor: darkTheme ? '#2a2a3a' : '#F3F4F6' }
                ]}>
                  <Icon
                    name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color={t.textSecondary || t.secondaryText}
                  />
                </View>
              </View>

              {/* Expanded Body */}
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

        {/* Contact Footer Card */}
        <View style={[styles.footerCard, { backgroundColor: t.cardBg }]}>
          <Icon name="mail-outline" size={22} color={accentColor} />
          <View style={styles.footerCardText}>
            <Text style={[styles.footerCardTitle, { color: t.text }]}>Questions about our terms?</Text>
            <Text style={[styles.footerCardSubtitle, { color: t.textSecondary || t.secondaryText }]}>
              Reach us at legal@yourapp.com
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.footerCardButton, { backgroundColor: accentColor }]}
            onPress={() => Linking.openURL('mailto:legal@yourapp.com')}
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
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  scrollContent: { paddingBottom: 50 },

  // Hero
  heroBanner: {
    marginHorizontal: 20, marginTop: 20, borderRadius: 20,
    padding: 24, alignItems: 'center',
  },
  heroIconWrapper: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', lineHeight: 20, marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600' },

  // Intro Card
  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 20, marginTop: 16, borderRadius: 14, padding: 14,
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
  },
  accordionTitleWrapper: { flex: 1 },
  accordionNumber: { fontSize: 11, fontWeight: '700', marginBottom: 1 },
  accordionTitle: { fontSize: 15, fontWeight: '600' },
  chevronWrapper: {
    width: 30, height: 30, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  accordionBody: {
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12,
    borderTopWidth: 1,
  },
  accordionBodyText: { fontSize: 14, lineHeight: 22 },

  // Footer Contact Card
  footerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 16,
  },
  footerCardText: { flex: 1 },
  footerCardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  footerCardSubtitle: { fontSize: 12 },
  footerCardButton: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  footerCardButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default TermsOfServiceScreen;