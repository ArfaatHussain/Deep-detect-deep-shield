// src/theme/theme.js

export const getTheme = (darkTheme) => ({
  // ---------- BACKGROUND ----------
  background: darkTheme ? '#0F172A' : '#e4e6e8',

  // ---------- TEXT ----------
  textPrimary: darkTheme ? '#F1F5F9' : '#1E293B',
  textSecondary: darkTheme ? '#94A3B8' : '#475569',
  primaryText: darkTheme ? '#F1F5F9' : '#111827',
  secondaryText: darkTheme ? '#94A3B8' : '#6B7280',
  labelText: darkTheme ? '#CBD5E1' : '#4B5563',
  descriptionText: darkTheme ? '#CBD5E1' : '#6B7280',
  emptyText: darkTheme ? '#94A3B8' : '#9CA3AF',
  headerText: darkTheme ? '#F1F5F9' : '#111827',
  text: darkTheme ? '#F1F5F9' : '#111827',

  // ---------- CARDS ----------
  cardBg: darkTheme ? '#1E293B' : '#FFFFFF',
  cardBgTransparent: darkTheme ? 'rgba(30,41,59,0.8)' : '#FFFFFF',
  cardBorder: darkTheme ? '#334155' : '#CBD5E1',
  cardShadowOpacity: darkTheme ? 0.2 : 0.05,

  // ---------- HEADER ----------
  headerBg: darkTheme ? '#1E293B' : '#FFFFFF',
  headerBorder: darkTheme ? '#334155' : '#E5E7EB',
  headerShadowOpacity: darkTheme ? 0.3 : 0.1,

  // ---------- INPUT ----------
  inputBg: darkTheme ? '#1E293B' : '#FFFFFF',
  inputBorder: darkTheme ? '#334155' : '#747a81',
  focusBorder: '#2563EB',
  placeholder: darkTheme ? '#94A3B8' : '#94A3B8',

  // ---------- ICONS ----------
  iconColor: darkTheme ? '#60A5FA' : '#3B82F6',
  logoutIcon: darkTheme ? '#F1F5F9' : '#111827',
  uploadIcon: darkTheme ? '#60A5FA' : '#3B82F6',

  // ---------- BUTTONS & LINKS ----------
  button: '#2563EB',
  buttonDisabled: '#475569',
  detectButtonBg: '#2563EB',
  detectButtonDisabled: '#475569',
  logoutBtnBg: darkTheme ? '#0F172A' : '#F3F4F6',
  link: '#60A5FA',
  downloadButtonBg: '#2563EB',

  // ---------- SWITCH ----------
  switchTrackFalse: '#D1D5DB',
  switchTrackTrue: '#2563EB',
  switchThumb: darkTheme ? '#60A5FA' : '#F3F4F6',

  // ---------- MODAL ----------
  modalBg: darkTheme ? '#1E293B' : '#FFFFFF',
  modalBorder: darkTheme ? '#334155' : '#E5E7EB',
  modalShadowOpacity: darkTheme ? 0.3 : 0.1,
  modalText: darkTheme ? '#F1F5F9' : '#111827',

  // ---------- TABS (History) ----------
  tabContainerBg: darkTheme ? '#1E293B' : '#EDEDED',
  tabBg: darkTheme ? '#1E293B' : '#F3F4F6',
  tabActiveBg: darkTheme ? '#334155' : '#FFFFFF',
  tabBorder: darkTheme ? '#334155' : '#CBD5E1',
  tabText: darkTheme ? '#CBD5E1' : '#9CA3AF',
  tabActiveText: darkTheme ? '#F1F5F9' : '#111827',

  // ---------- RESULTS ----------
  resultFakeBg: '#7F1D1D',
  resultFakeBorder: '#EF4444',
  resultRealBg: '#064E3B',
  resultRealBorder: '#10B981',

  // ---------- SPLASH ----------
  title: darkTheme ? '#F1F5F9' : '#1E293B',
  subtitle: darkTheme ? '#94A3B8' : '#475569',
  progressBg: darkTheme ? '#1E293B' : '#E5E7EB',
  gradientStart: darkTheme ? '#2563EB' : '#3B82F6',
  gradientEnd: darkTheme ? '#9333EA' : '#8B5CF6',
  loadingText: darkTheme ? '#64748B' : '#6B7280',
  logoBorder: darkTheme ? '#F1F5F9' : '#1E293B',
  titleShadow: darkTheme
    ? 'rgba(255, 255, 255, 0.3)'
    : 'rgba(0,0,0,0.2)',

  // ---------- MISC ----------
  featureNumber: '#3B82F6',

  // ---------- MODAL ----------
  modalBg: darkTheme ? "#1E293B" : "#F8FAFC",
  titleColor: darkTheme ? "#F1F5F9" : "#1E293B",
  messageColor: darkTheme ? "#CBD5E1" : "#334155",
  logoutIconColor: darkTheme ? '#a01616' : '#a01616'
});
