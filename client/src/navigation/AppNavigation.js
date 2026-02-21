import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import Dashboard from "../screens/Dashboard";
import ImageDetection from "../screens/ImageDetection";
import LoginScreen from "../screens/LoginScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SignupScreen from "../screens/SignupScreen";
import SplashScreen from "../screens/SplashScreen";
import TamperProof from "../screens/TamperProof";
import VideoDetection from "../screens/VideoDetection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import History from "../screens/History";
import ProtectScreen from "../screens/ProtectScreen";
import VerifyScreen from "../screens/VerifyScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BottomTabs = () => {
    return (
        <Tab.Navigator
            initialRouteName="Dashboard"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 5,
                },
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === "Dashboard") {
                        iconName = "home-outline";
                    }
                    else if (route.name === "History") {
                        iconName = "repeat-outline"
                    }
                    else if (route.name === "Settings") {
                        iconName = "settings-outline";
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={Dashboard} />
            <Tab.Screen name="History" component={History} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

const AppNavigation = ({ darkTheme }) => {
    const [user, setUser] = useState();
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        const checkUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("user");
                const parsedUser = storedUser ? JSON.parse(storedUser) : null;

                setTimeout(() => {
                    setUser(parsedUser);
                    setLoading(false);
                }, 2500);
            } catch (e) {
                console.log("Error fetching user:", e);
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer theme={darkTheme ? DarkTheme : DefaultTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                }}
                initialRouteName={user && Object.keys(user).length > 0 ? "BottomTabs" : "Login"}
            >
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="BottomTabs" component={BottomTabs} />
                <Stack.Screen name="ImageDetection" component={ImageDetection} />
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="TamperProof" component={TamperProof} />
                <Stack.Screen name="VideoDetection" component={VideoDetection} />
                <Stack.Screen name="ProtectScreen" component={ProtectScreen} />
                <Stack.Screen name="VerifyScreen" component={VerifyScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;
