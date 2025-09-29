import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import Dashboard from "../screens/Dashboard"
import ImageDetection from "../screens/ImageDetection"
import LoginScreen from "../screens/LoginScreen"
import SettingsScreen from "../screens/SettingsScreen"
import SignupScreen from "../screens/SignupScreen"
import SplashScreen from "../screens/SplashScreen"
import TamperProof from "../screens/TamperProof"
import VideoDetection from "../screens/VideoDetection"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

const Stack = createStackNavigator()

const AppNavigation = ({ darkTheme }) => {
    const [user, setUser] = useState()
    const [loading, setLoading] = useState(true)
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
    }, [])

    if (loading) {
        return <SplashScreen />
    }

    return (
        <NavigationContainer theme={darkTheme ? DarkTheme : DefaultTheme} >
            <Stack.Navigator
                screenOptions={{
                    headerShown: false
                }}
                initialRouteName={user && Object.keys(user).length > 0 ? "Dashboard" : "Login"}
            >
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Dashboard" component={Dashboard} />
                <Stack.Screen name="ImageDetection" component={ImageDetection} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="TamperProof" component={TamperProof} />
                <Stack.Screen name="VideoDetection" component={VideoDetection} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default AppNavigation