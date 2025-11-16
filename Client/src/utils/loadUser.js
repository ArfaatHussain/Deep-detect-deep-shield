import AsyncStorage from "@react-native-async-storage/async-storage";
export const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem("user")
    if (storedUser) {
        const currentUser = JSON.parse(storedUser)
        return currentUser
    }
};