import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AuthService from '../service/AuthService';
import CustomModal from '../../components/CustomModal';
import { ThemeContext } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUser } from '../utils/loadUser';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory } from '../service/userService';
const Dashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({})
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { darkTheme } = useContext(ThemeContext);

  useEffect(() => {
    (async () => {
      const currentUser = await loadUser()
      setUser(currentUser)
    })()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        getUserHistory(user._id)
      }
    }, [user])
  )

  const getUserHistory = async (userId) => {
    try {
      const response = await getHistory(userId)
      console.log(response.data.imageHistory);
      const imagesCount = response.data.imageHistory.length;
      const videosCount = response.data.videoHistory.length;
      console.log("Image count: ", imagesCount, "\nVide count: ", videosCount);

      setAnalytics({ imagesCount, videosCount })
    } catch (error) {

    }
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user")
    await AsyncStorage.removeItem("accessToken")
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
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: darkTheme ? '#0F172A' : '#F9FAFB' },
      ]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: darkTheme ? '#1E293B' : '#E2E8F0',
            borderBottomColor: darkTheme ? '#334155' : '#CBD5E1',
          },
        ]}>
        <View style={styles.userInfo}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon
                name="person-circle-outline"
                size={70}
                color={darkTheme ? '#94A3B8' : '#475569'}
              />
            </View>
          )}
          <View style={{ marginLeft: 12 }}>
            <Text
              style={[
                styles.userName,
                { color: darkTheme ? '#F1F5F9' : '#1E293B' },
              ]}>
              {user?.fullName || 'User'}
            </Text>

            <Text
              style={[
                styles.welcome,
                { color: darkTheme ? '#94A3B8' : '#475569', fontSize: 12 },
              ]}>
              {user?.email}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setLogoutModalVisible(true)}
          style={[
            styles.logoutButton,
            { backgroundColor: darkTheme ? '#0F172A' : '#aaacafff' },
          ]}>
          <Icon
            name="log-out-outline"
            size={26}
            color={darkTheme ? '#F1F5F9' : 'black'}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.sectionTitle,
            { color: darkTheme ? '#F1F5F9' : '#1E293B' },
          ]}>
          Deepfake Detection Tools
        </Text>

        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              {
                backgroundColor: darkTheme ? '#1E293B' : '#E2E8F0',
                borderColor: darkTheme ? '#334155' : '#CBD5E1',
              },
            ]}
            onPress={() => navigation.navigate(feature.screen)}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: feature.color },
              ]}>
              <Icon name={feature.icon} size={30} color="#F1F5F9" />
            </View>
            <View style={styles.featureInfo}>
              <Text
                style={[
                  styles.featureTitle,
                  { color: darkTheme ? '#F1F5F9' : '#1E293B' },
                ]}>
                {feature.title}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: darkTheme ? '#94A3B8' : '#475569' },
                ]}>
                {feature.description}
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={darkTheme ? '#64748B' : '#475569'}
            />
          </TouchableOpacity>
        ))}

        {/* Stats Section */}
        <View
          style={[
            styles.statsContainer,
            {
              backgroundColor: darkTheme ? '#1E293B' : '#E2E8F0',
              borderColor: darkTheme ? '#334155' : '#CBD5E1',
            },
          ]}>
          <Text
            style={[
              styles.statsTitle,
              { color: darkTheme ? '#F1F5F9' : '#1E293B' },
            ]}>
            Recent Activity
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#60A5FA' }]}>{Number(analytics?.imagesCount ?? 0)}</Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: darkTheme ? '#94A3B8' : '#475569' },
                ]}>
                Images Analyzed
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#60A5FA' }]}>{Number(analytics?.videosCount ?? 0)}</Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: darkTheme ? '#94A3B8' : '#475569' },
                ]}>
                Videos Analyzed
              </Text>
            </View>
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
        contentStyle={{
          backgroundColor: darkTheme ? '#1E293B' : '#FFFFFF',
          borderColor: darkTheme ? '#334155' : '#CBD5E1',
        }}
        textStyle={{
          color: darkTheme ? '#F1F5F9' : '#0F172A',
        }}>
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: darkTheme ? '#DC2626' : '#B91C1C' },
            ]}
            onPress={handleLogout}>
            <Text style={styles.modalButtonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: darkTheme ? '#334155' : '#b8bbc0ff' },
            ]}
            onPress={() => setLogoutModalVisible(false)}>
            <Text style={styles.modalButtonText}>Cancel</Text>
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: { fontSize: 16, letterSpacing: 0.3 },
  userName: { fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
  logoutButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1B1B1B',
  },
  content: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  featureDescription: { fontSize: 14, lineHeight: 20 },
  statsContainer: {
    padding: 24,
    borderRadius: 16,
    marginTop: 24,
    borderWidth: 1,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', letterSpacing: 0.5 },
  statLabel: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 15,
  },
  modalButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    width: 130,
    alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Dashboard;
