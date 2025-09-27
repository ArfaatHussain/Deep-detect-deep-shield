import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Context
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import Dashboard from './src/screens/Dashboard';
import ImageDetection from './src/screens/ImageDetection';
import VideoDetection from './src/screens/VideoDetection';
import TamperProof from './src/screens/TamperProof';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ Bottom Tab Navigator with theme integration
function MainTabs() {
  const { darkTheme } = React.useContext(ThemeContext); // access theme

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: darkTheme ? '#0F172A' : '#F9FAFB',
          borderTopColor: darkTheme ? '#334155' : '#E2E8F0',
          height: 60,
          paddingTop: 10,
        },
        tabBarActiveTintColor: darkTheme ? '#60A5FA' : '#2563EB',
        tabBarInactiveTintColor: darkTheme ? '#94A3B8' : '#475569',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home-outline';
          else if (route.name === 'Settings') iconName = 'settings-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const App = () => {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ darkTheme }) => (
          <NavigationContainer theme={darkTheme ? DarkTheme : DefaultTheme}>
            <StatusBar
              barStyle={darkTheme ? 'light-content' : 'dark-content'}
            />
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />

              {/* ✅ use MainTabs instead of direct Dashboard */}
              <Stack.Screen name="MainTabs" component={MainTabs} />

              {/* other stack screens */}
              <Stack.Screen name="ImageDetection" component={ImageDetection} />
              <Stack.Screen name="VideoDetection" component={VideoDetection} />
              <Stack.Screen name="TamperProof" component={TamperProof} />
            </Stack.Navigator>
          </NavigationContainer>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
};

export default App;
