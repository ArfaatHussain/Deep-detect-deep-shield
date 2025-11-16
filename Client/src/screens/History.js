import React, { useCallback, useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import toast from "react-native-simple-toast"
import { getHistory } from "../service/userService";
import { loadUser } from "../utils/loadUser";
import { ThemeContext } from '../context/ThemeContext';
export default function History() {
    const [activeTab, setActiveTab] = useState("image");
    const [user, setUser] = useState()
    const [imageHistory, setImageHistory] = useState([])
    const [videoHistory, setVideoHistory] = useState([])
    const { darkTheme } = useContext(ThemeContext);
    const tabs = [
        { id: "image", label: "Image Detection", icon: "image-outline" },
        { id: "video", label: "Video Detection", icon: "videocam-outline" },
    ];

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
            // console.log(response.data.imageHistory);

            setImageHistory(response.data.imageHistory)
            setVideoHistory(response.data.videoHistory)
        } catch (error) {
            if (error.response.status == 404) {
                // toast.show("No history found.")
                setImageHistory([])
                setVideoHistory([])
            }
            else {
                console.error(error);
            }
        }
    }

    const renderItem = ({ item }) => {
        const hasDetectionResult =
            item.detectionResult &&
            Object.keys(item.detectionResult).length > 0 &&
            item.detectionResult.resultImage;

        return (
            <View style={[styles.historyCard, {
                backgroundColor: darkTheme ? '#1E293B' : '#FFF',
                borderColor: darkTheme ? '#334155' : '#E8E8E8'
            }]}>
                {hasDetectionResult ? (
                    <View style={{ flexDirection: 'row' }}>
                        {/* Original Image */}
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    marginBottom: 10,
                                    color: darkTheme ? '#CBD5E1' : '#969191',
                                    fontWeight: '600',
                                }}
                            >
                                Original Image
                            </Text>
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={{ height: 150, width: 150, resizeMode: 'cover', borderRadius: 12 }}
                            />
                        </View>

                        {/* Result Image */}
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    marginBottom: 10,
                                    color: darkTheme ? '#CBD5E1' : '#969191',
                                    fontWeight: '600',
                                }}
                            >
                                Detection Image
                            </Text>
                            <Image
                                source={{ uri: item.detectionResult.resultImage }}
                                style={{ height: 150, width: 150, resizeMode: 'cover', borderRadius: 12 }}
                            />
                        </View>
                    </View>
                ) : (
                    <View>
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={{ height: 300, width: '100%', resizeMode: 'cover', borderRadius: 12 }}
                        />
                    </View>
                )}

                <Text style={{ marginTop: 10, color: darkTheme ? '#CBD5E1' : '#969191' }}>
                    {item.detectionResult?.explanation || ''}
                </Text>
            </View>
        )
    };


    return (
        <View style={[styles.container, { backgroundColor: darkTheme ? '#0F172A' : '#F9FAFB' }]}>
            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: darkTheme ? '#1E293B' : '#EDEDED' }]}>
                {tabs.map((t) => (
                    <TouchableOpacity
                        key={t.id}
                        style={[
                            styles.tab,
                            activeTab === t.id && styles.activeTab,
                            {
                                backgroundColor: activeTab === t.id
                                    ? darkTheme ? '#334155' : '#FFF'
                                    : darkTheme ? '#1E293B' : '#E2E8F0',
                                borderColor: darkTheme ? '#334155' : '#CBD5E1',
                            }
                        ]}
                        onPress={() => setActiveTab(t.id)}
                    >
                        <Ionicons
                            name={t.icon}
                            size={18}
                            color={activeTab === t.id ? (darkTheme ? '#F1F5F9' : '#000') : '#777'}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === t.id && styles.activeTabText,
                                { color: darkTheme ? (activeTab === t.id ? '#F1F5F9' : '#CBD5E1') : (activeTab === t.id ? '#1E293B' : '#777') }
                            ]}
                        >
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content List */}
            <FlatList
                data={activeTab === "image" ? imageHistory : videoHistory}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingVertical: 10 }}
                ListEmptyComponent={() => (
                    <Text style={{ color: darkTheme ? '#94A3B8' : '#a4a2a2', textAlign: 'center' }}>No history yet.</Text>
                )}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: "#F7F7F7",
        paddingHorizontal: 20,
        paddingTop: 15
    },

    header: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
        color: "#000",
    },

    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#EDEDED",
        padding: 5,
        borderRadius: 12,
        marginBottom: 20,
    },

    tab: {
        flex: 1,
        justifyContent: "center",
        paddingVertical: 5,
        borderRadius: 10,
        alignItems: 'center'
    },

    activeTab: {
        backgroundColor: "#FFF",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },

    tabText: {
        fontSize: 12,
        color: "#777",
    },

    activeTabText: {
        color: "#000",
        fontWeight: "600",
    },

    historyCard: {
        backgroundColor: "#FFF",
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E8E8E8",
    },

    historyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
    },

    historyDate: {
        fontSize: 13,
        color: "#777",
        marginTop: 4,
    },
});
