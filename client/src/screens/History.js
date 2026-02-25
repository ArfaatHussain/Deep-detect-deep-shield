import React, { useCallback, useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getHistory } from "../service/userService";
import { loadUser } from "../utils/loadUser";
import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { API_URL, PYTHON_API_URL } from "../../config";

export default function History() {
    const [activeTab, setActiveTab] = useState("image");
    const [user, setUser] = useState();
    const [imageHistory, setImageHistory] = useState([]);
    const [videoHistory, setVideoHistory] = useState([]);
    const [tamperGenerationHistory, setTamperGenerationHistory] = useState([])
    const [tamperVerificationHistory, setTamperVerificationHistory] = useState([])
    const { darkTheme } = useContext(ThemeContext);

    const t = getTheme(darkTheme);

    const tabs = [
        { id: "image", label: "Image", icon: "image-outline" },
        { id: "video", label: "Video", icon: "videocam-outline" },
        { id: "tamper", label: "Tamper Proof", icon: "shield-checkmark-outline" },
    ];

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
            setImageHistory(response.data.imageHistory || []);
            setVideoHistory(response.data.videoHistory || []);
            setTamperGenerationHistory(response.data.tamperGenerationHistory || [])
            setTamperVerificationHistory(response.data.tamperVerificationHistory || [])
        } catch (error) {
            setImageHistory([]);
            setVideoHistory([]);
            console.error(error);
        }
    };

    function getUrl() {
        if (activeTab == "image") return API_URL
        else if (activeTab == "video") return API_URL
        else return PYTHON_API_URL
    }

    const renderItem = ({ item }) => {
        const hasDetectionResult =
            item.detectionResult &&
            Object.keys(item.detectionResult).length > 0 &&
            item.detectionResult.resultImage;

        if (activeTab === "image") {
            return (
                <View
                    style={[
                        styles.historyCard,
                        {
                            backgroundColor: t.cardBg,
                            borderColor: t.cardBorder,
                            shadowOpacity: t.cardShadowOpacity,
                        },
                    ]}
                >
                    {hasDetectionResult ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                    Original Image
                                </Text>
                                <Image source={{ uri: `${getUrl()}${item.imageUrl}` }} style={styles.historyImage} />
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                    Detection Result
                                </Text>
                                <Image
                                    source={{ uri: `${API_URL}${item.detectionResult.resultImage}` }}
                                    style={styles.historyImage}
                                />
                            </View>
                        </View>
                    ) : (
                        <Image
                            source={{ uri: `${getUrl()}${item.imageUrl}` }}
                            style={[styles.historyImage, { width: '100%' }]}
                        />
                    )}

                    <Text style={[styles.explanationText, { color: t.descriptionText }]}>
                        {item.detectionResult?.explanation || ''}
                    </Text>
                </View>
            );
        } else if (activeTab === "video") {
            return (
                <View>
                    <Text>Video module history</Text>
                </View>
            );
        } else {
            // Tamper history module
            return (
                <View
                    style={[
                        styles.historyCard,
                        {
                            backgroundColor: t.cardBg,
                            borderColor: t.cardBorder,
                            shadowOpacity: t.cardShadowOpacity,
                        },
                    ]}
                >
                    <Text>Tamper history module</Text>
                </View>
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: t.background }]}>
            <View style={[styles.tabContainer, { backgroundColor: t.tabContainerBg }]}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                isActive && styles.activeTab,
                                {
                                    backgroundColor: isActive ? t.tabActiveBg : t.tabBg,
                                    borderColor: t.tabBorder,
                                    shadowOpacity: isActive ? t.cardShadowOpacity : 0,
                                },
                            ]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={18}
                                color={isActive ? t.tabActiveText : t.tabText}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    isActive && styles.activeTabText,
                                    { color: isActive ? t.tabActiveText : t.tabText },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={activeTab === "image" ? imageHistory : videoHistory}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
                ListEmptyComponent={() => (
                    <Text style={{ color: t.emptyText, textAlign: 'center', marginTop: 20 }}>
                        No history yet.
                    </Text>
                )}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 15 },
    tabContainer: {
        flexDirection: "row",
        padding: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 7,
    },
    tab: {
        flex: 1,
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
        borderWidth: 1,
    },
    activeTab: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 3,
    },
    tabText: { fontSize: 12 },
    activeTabText: { fontWeight: "600", fontSize: 13 },
    historyCard: {
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    historyImage: {
        height: 150,
        borderRadius: 12,
        resizeMode: 'contain',
    },
    imageLabel: {
        marginBottom: 8,
        fontWeight: '600',
        fontSize: 13,
    },
    explanationText: {
        marginTop: 10,
        fontSize: 12,
        lineHeight: 18,
    },
});
