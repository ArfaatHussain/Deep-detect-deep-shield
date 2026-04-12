import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomModal from '../../components/CustomModal';
import { ThemeContext } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUser } from '../utils/loadUser';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory } from '../service/userService';
import { getTheme } from '../context/theme';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { darkTheme } = useContext(ThemeContext);

  const t = getTheme(darkTheme);

  useEffect(() => {
    (async () => {
      const currentUser = await loadUser();
      setUser(currentUser);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        getUserHistory(user._id);
      }
    }, [user])
  );

  const getUserHistory = async (userId) => {
    try {
      const response = await getHistory(userId);
      const imagesCount = response.data.imageHistory.length;
      const videosCount = response.data.videoHistory.length;
      const imagesProtected = response.data.tamperGenerationHistory?.length || 0;
      setAnalytics({ imagesCount, videosCount, imagesProtected });
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    setLogoutModalVisible(false);
    navigation.replace('Login');
  };

  const features = [
    {
      id: 1,
      title: 'Image Detection',
      description: 'Upload and analyze images for deepfake detection',
      icon: 'image-outline',
      screen: 'ImageDetection',
      color: '#2563EB',
    },
    {
      id: 2,
      title: 'Video Detection',
      description: 'Analyze videos for deepfake content',
      icon: 'videocam-outline',
      screen: 'VideoDetection',
      color: '#7C3AED',
    },
    {
      id: 3,
      title: 'Tamper-Proof',
      description: 'Apply security measures to protect media',
      icon: 'shield-checkmark-outline',
      screen: 'TamperProof',
      color: '#10B981',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: t.headerBg,
            borderBottomColor: t.headerBorder,
            shadowOpacity: t.headerShadowOpacity,
          },
        ]}
      >
        <View style={styles.userInfo}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={[styles.avatarImage, { borderColor: t.cardBorder }]}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person-circle-outline" size={70} color={t.secondaryText} />
            </View>
          )}
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.userName, { color: t.primaryText }]}>
              {user?.fullName || 'User'}
            </Text>
            <Text style={[styles.welcome, { color: t.secondaryText, fontSize: 12 }]}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: t.primaryText }]}>
          Deepfake Detection Tools
        </Text>

        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              {
                backgroundColor: t.cardBg,
                borderColor: t.cardBorder,
                shadowOpacity: darkTheme ? 0.2 : 0.1,
              },
            ]}
            onPress={() => navigation.navigate(feature.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
              <Icon name={feature.icon} size={30} color="#FFFFFF" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: t.primaryText }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: t.secondaryText }]}>
                {feature.description}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={t.secondaryText} />
          </TouchableOpacity>
        ))}

        {/* Professional Analytics Section */}
        <View
          style={[
            styles.statsContainer,
            {
              backgroundColor: t.cardBg,
              borderColor: t.cardBorder,
              shadowOpacity: darkTheme ? 0.2 : 0.1,
            },
          ]}
        >
          <View style={styles.statsHeader}>
            <View style={styles.statsHeaderLeft}>
              <LinearGradient
                colors={[t.primaryColor || '#2563EB', t.secondaryColor || '#7C3AED']}
                style={styles.statsIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="analytics" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.statsTitle, { color: t.primaryText }]}>
                Analytics Overview
              </Text>
            </View>
            <View style={[styles.periodBadge, { backgroundColor: darkTheme ? '#1E293B' : '#F1F5F9' }]}>
              <Icon name="time-outline" size={14} color={t.secondaryText} />
              <Text style={[styles.periodText, { color: t.secondaryText }]}>All Time</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: darkTheme ? '#0F172A' : '#F8FAFC' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#2563EB20' }]}>
                <Icon name="image" size={24} color="#2563EB" />
              </View>
              <Text style={[styles.statValue, { color: t.primaryText }]}>
                {analytics?.imagesCount ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: t.secondaryText }]}>
                Images Analyzed
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: darkTheme ? '#0F172A' : '#F8FAFC' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#7C3AED20' }]}>
                <Icon name="videocam" size={24} color="#7C3AED" />
              </View>
              <Text style={[styles.statValue, { color: t.primaryText }]}>
                {analytics?.videosCount ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: t.secondaryText }]}>
                Videos Analyzed
              </Text>

            </View>
          </View>

          <View style={styles.protectedCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.protectedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.protectedContent}>
                <View style={styles.protectedLeft}>
                  <View style={styles.protectedIconContainer}>
                    <Icon name="shield-checkmark" size={28} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.protectedValue}>
                      {analytics?.imagesProtected ?? 0}
                    </Text>
                    <Text style={styles.protectedLabel}>
                      Images Protected
                    </Text>
                  </View>
                </View>
                <View style={styles.protectedBadge}>
                  <Icon name="lock-closed" size={14} color="#FFFFFF" />
                  <Text style={styles.protectedBadgeText}>Tamper-Proof</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Logout Modal */}
      <CustomModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title="Logout"
        message="Are you sure you want to logout?"
        type="error"
        contentStyle={{ backgroundColor: t.modalBg, borderColor: t.modalBorder }}
        textStyle={{ color: t.modalText }}
      >
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: t.logoutIconColor }]}
            onPress={handleLogout}
          >
            <Text style={styles.modalButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#E5E7EB' }]}
            onPress={() => setLogoutModalVisible(false)}
          >
            <Text style={[styles.modalButtonText, { color: '#111827' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 35,
    borderBottomWidth: 1,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 2 },
  avatarPlaceholder: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
  welcome: { fontSize: 16, letterSpacing: 0.3 },
  userName: { fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
  logoutButton: { justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8 },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, letterSpacing: 0.5 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  featureDescription: { fontSize: 14, lineHeight: 20 },
  
  // Updated Professional Analytics Styles
  statsContainer: { 
    padding: 20, 
    borderRadius: 20, 
    marginTop: 24, 
    borderWidth: 1, 
    shadowColor: '#020617', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 12, 
    elevation: 6,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsTitle: { 
    fontSize: 18, 
    fontWeight: '600',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  protectedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  protectedGradient: {
    padding: 16,
  },
  protectedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  protectedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  protectedValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  protectedLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  protectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  insightsContainer: {
    marginTop: 4,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 12,
  },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 15 },
  modalButton: { marginTop: 12, padding: 12, borderRadius: 8, width: 130, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Dashboard;