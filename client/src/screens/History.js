import React, { useCallback, useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { getHistory } from "../service/userService";
import { loadUser } from "../utils/loadUser";
import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { API_URL, PYTHON_API_URL } from "../../config";
import Toast from 'react-native-simple-toast';

export default function History() {
    const [activeTab, setActiveTab] = useState("image");
    const [user, setUser] = useState();
    const [imageHistory, setImageHistory] = useState([]);
    const [videoHistory, setVideoHistory] = useState([]);
    const [tamperGenerationHistory, setTamperGenerationHistory] = useState([]);
    const [tamperVerificationHistory, setTamperVerificationHistory] = useState([]);
    const { darkTheme } = useContext(ThemeContext);
    
    // Download states
    const [downloadLoading, setDownloadLoading] = useState({});
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    
    // Filter states
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [imageVideoFilter, setImageVideoFilter] = useState("all"); // all, real, fake
    const [tamperFilter, setTamperFilter] = useState("all"); // all, protect, verify
    
    // Filtered data states
    const [filteredImageHistory, setFilteredImageHistory] = useState([]);
    const [filteredVideoHistory, setFilteredVideoHistory] = useState([]);
    const [filteredTamperHistory, setFilteredTamperHistory] = useState([]);

    const t = getTheme(darkTheme);

    const tabs = [
        { id: "image", label: "Image", icon: "image-outline" },
        { id: "video", label: "Video", icon: "videocam-outline" },
        { id: "tamper", label: "Tamper Proof", icon: "shield-checkmark-outline" },
    ];

    // Filter options
    const imageVideoFilterOptions = [
        { id: "all", label: "All", icon: "apps-outline" },
        { id: "real", label: "Real", icon: "checkmark-circle-outline" },
        { id: "fake", label: "Fake", icon: "close-circle-outline" },
    ];

    const tamperFilterOptions = [
        { id: "all", label: "All", icon: "apps-outline" },
        { id: "protect", label: "Protect", icon: "shield-outline" },
        { id: "verify", label: "Verify", icon: "scan-outline" },
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

    // Apply filters whenever history data or filter criteria change
    useEffect(() => {
        applyFilters();
    }, [imageHistory, videoHistory, tamperGenerationHistory, tamperVerificationHistory, imageVideoFilter, tamperFilter, activeTab]);

    const getUserHistory = async (userId) => {
        try {
            const response = await getHistory(userId);
            console.log("Tamper Generation History:", response.data.tamperGenerationHistory);
            console.log("Tamper Verification History:", response.data.tamperVerificationHistory);
            
            setImageHistory(response.data.imageHistory || []);
            setVideoHistory(response.data.videoHistory || []);
            setTamperGenerationHistory(response.data.tamperGenerationHistory || []);
            setTamperVerificationHistory(response.data.tamperVerificationHistory || []);
        } catch (error) {
            setImageHistory([]);
            setVideoHistory([]);
            console.error(error);
        }
    };

    const applyFilters = () => {
        // Filter image history
        if (imageVideoFilter === "all") {
            setFilteredImageHistory(imageHistory);
        } else {
            const filtered = imageHistory.filter(item => {
                const hasDetectionResult = item.detectionResult && 
                    Object.keys(item.detectionResult).length > 0 && 
                    item.detectionResult.resultImage;
                
                if (imageVideoFilter === "real") {
                    return !hasDetectionResult;
                } else if (imageVideoFilter === "fake") {
                    return hasDetectionResult;
                }
                return true;
            });
            setFilteredImageHistory(filtered);
        }

        // Filter video history
        if (imageVideoFilter === "all") {
            setFilteredVideoHistory(videoHistory);
        } else {
            const filtered = videoHistory.filter(item => {
                const hasDetectionResult = item.detectionResult && 
                    Object.keys(item.detectionResult).length > 0 && 
                    item.detectionResult.resultVideo;
                
                if (imageVideoFilter === "real") {
                    return !hasDetectionResult;
                } else if (imageVideoFilter === "fake") {
                    return hasDetectionResult;
                }
                return true;
            });
            setFilteredVideoHistory(filtered);
        }

        // Filter tamper history
        const allTamperHistory = [...tamperGenerationHistory, ...tamperVerificationHistory];
        if (tamperFilter === "all") {
            setFilteredTamperHistory(allTamperHistory);
        } else {
            const filtered = allTamperHistory.filter(item => {
                if (tamperFilter === "protect") {
                    return tamperGenerationHistory.some(genItem => genItem._id === item._id);
                } else if (tamperFilter === "verify") {
                    return tamperVerificationHistory.some(verItem => verItem._id === item._id);
                }
                return true;
            });
            setFilteredTamperHistory(filtered);
        }
    };

    const getCurrentFilterOptions = () => {
        if (activeTab === "tamper") {
            return {
                options: tamperFilterOptions,
                currentFilter: tamperFilter,
                setFilter: setTamperFilter
            };
        } else {
            return {
                options: imageVideoFilterOptions,
                currentFilter: imageVideoFilter,
                setFilter: setImageVideoFilter
            };
        }
    };

    const getCurrentFilterLabel = () => {
        const { options, currentFilter } = getCurrentFilterOptions();
        const option = options.find(opt => opt.id === currentFilter);
        return option ? option.label : "Filter";
    };

    const getCurrentData = () => {
        if (activeTab === "image") return filteredImageHistory;
        if (activeTab === "video") return filteredVideoHistory;
        return filteredTamperHistory;
    };

    // Download function for detection result images
    const downloadDetectionResult = async (item) => {
        if (!item?.detectionResult?.resultImage) {
            Toast.show("No detection result image available");
            return;
        }

        try {
            setDownloadLoading(prev => ({ ...prev, [item._id]: true }));

            // Request permission
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== "granted") {
                Toast.show("Please allow media access to download images.");
                return;
            }

            // Build file name
            const photoUrl = item.detectionResult.resultImage;
            const fileName = photoUrl.replace(/^.*[\\/]/, '');
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            // Download image
            const { uri } = await FileSystem.downloadAsync(
                `${API_URL}${photoUrl}`,
                fileUri
            );

            // Save to gallery
            await MediaLibrary.createAssetAsync(uri);

            Toast.show("Image saved to gallery");
        } catch (error) {
            console.error("Download error:", error);
            Toast.show("Failed to download image");
        } finally {
            setDownloadLoading(prev => ({ ...prev, [item._id]: false }));
        }
    };

    const FilterModal = () => {
        const { options, currentFilter, setFilter } = getCurrentFilterOptions();

        return (
            <Modal
                visible={showFilterModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFilterModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: t.cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: t.text }]}>
                                Filter by
                            </Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={t.text} />
                            </TouchableOpacity>
                        </View>
                        
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.filterOption,
                                    currentFilter === option.id && { backgroundColor: t.tabActiveBg + '20' }
                                ]}
                                onPress={() => {
                                    setFilter(option.id);
                                    setShowFilterModal(false);
                                }}
                            >
                                <Ionicons 
                                    name={option.icon} 
                                    size={20} 
                                    color={currentFilter === option.id ? t.tabActiveText : t.text} 
                                />
                                <Text style={[
                                    styles.filterOptionText, 
                                    { 
                                        color: currentFilter === option.id ? t.tabActiveText : t.text,
                                        fontWeight: currentFilter === option.id ? '600' : '400'
                                    }
                                ]}>
                                    {option.label}
                                </Text>
                                {currentFilter === option.id && (
                                    <Ionicons name="checkmark" size={20} color={t.tabActiveText} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    function getUrl() {
        if (activeTab === "image") return API_URL;
        if (activeTab === "video") return API_URL;
        return PYTHON_API_URL;
    }

    const renderTamperItem = ({ item }) => {
        const isProtect = tamperGenerationHistory.some(genItem => genItem._id === item._id);
        
        return (
            <View
                style={[
                    styles.historyCard,
                    {
                        backgroundColor: t.cardBg,
                        shadowOpacity: t.cardShadowOpacity,
                    },
                ]}
            >
                {/* Type Badge */}
                <View style={styles.badgeContainer}>
                    <View
                        style={[
                            styles.badge,
                            {
                                backgroundColor: isProtect ? "#0c710f" : "#FF9800",
                            },
                        ]}
                    >
                        <Ionicons 
                            name={isProtect ? "shield" : "scan"} 
                            size={12} 
                            color="#fff" 
                        />
                        <Text style={styles.badgeText}>
                            {isProtect ? "PROTECT" : "VERIFY"}
                        </Text>
                    </View>
                </View>

                {/* Timestamp */}
                <Text style={[styles.itemTimestamp, { color: t.descriptionText }]}>
                    {new Date(item.createdAt).toLocaleString()}
                </Text>

                {/* Images Container */}
                <View style={styles.tamperImagesContainer}>
                    {/* Original/Tampered Image */}
                    <View style={styles.tamperImageWrapper}>
                        <Text style={[styles.imageLabel, { color: t.labelText }]}>
                            {isProtect ? "Original Image" : "Tampered Image"}
                        </Text>
                        <Image
                            source={{ uri: `${PYTHON_API_URL}${item.imageUrl}` }}
                            style={styles.tamperHistoryImage}
                            resizeMode="contain"
                            onError={(error) => console.log("Image loading error:", error.nativeEvent.error)}
                        />
                    </View>
                    
                    {/* Result/Protected Image - Always show if available */}
                    {item.resultImage && (
                        <View style={styles.tamperImageWrapper}>
                            <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                {isProtect ? "Protected Image" : "Extracted Image"}
                            </Text>
                            <Image
                                source={{ uri: `${PYTHON_API_URL}${item.resultImage}` }}
                                style={styles.tamperHistoryImage}
                                resizeMode="contain"
                                onError={(error) => console.log("Result image loading error:", error.nativeEvent.error)}
                            />
                        </View>
                    )}
                </View>

                {/* Verification Result (for verify items) */}
                {!isProtect && item.verificationResult && (
                    <View style={[styles.verificationContainer, { 
                        backgroundColor: item.verificationResult.isValid ? '#0c710f20' : '#7e050520',
                        borderColor: item.verificationResult.isValid ? '#0c710f' : '#7e0505',
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                    }]}>
                        <Ionicons 
                            name={item.verificationResult.isValid ? "checkmark-circle" : "close-circle"} 
                            size={20} 
                            color={item.verificationResult.isValid ? "#0c710f" : "#7e0505"} 
                        />
                        <View>
                            <Text style={[styles.verificationText, { 
                                color: item.verificationResult.isValid ? "#0c710f" : "#7e0505",
                                fontWeight: '600'
                            }]}>
                                {item.verificationResult.isValid ? 'Valid Image' : 'Invalid/Tampered Image'}
                            </Text>
                            {item.verificationResult.message && (
                                <Text style={[styles.verificationMessage, { color: t.descriptionText, marginTop: 2 }]}>
                                    {item.verificationResult.message}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Download button for result images */}
                {item.resultImage && (
                    <TouchableOpacity 
                        style={[styles.downloadButton, { position: 'relative', marginTop: 10, alignSelf: 'flex-end' }]}
                        onPress={() => {
                            // Add download functionality here
                            Toast.show('Download coming soon!');
                        }}
                    >
                        <Ionicons name="download-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderItem = ({ item }) => {
        if (activeTab === "tamper") {
            return renderTamperItem({ item });
        }

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
                            shadowOpacity: t.cardShadowOpacity,
                        },
                    ]}
                >
                    {/* ===== FAKE / REAL BADGE ===== */}
                    <View style={styles.badgeContainer}>
                        <View
                            style={[
                                styles.badge,
                                {
                                    backgroundColor: hasDetectionResult ? "#7e0505" : "#0c710f"
                                },
                            ]}
                        >
                            <Text style={styles.badgeText}>
                                {hasDetectionResult ? "FAKE" : "REAL"}
                            </Text>
                        </View>
                    </View>

                    {/* ===== DOWNLOAD ICON FOR FAKE ITEMS ===== */}
                    {hasDetectionResult && (
                        <TouchableOpacity 
                            style={[styles.downloadButton, { position: 'absolute', bottom:8,right:10 }]}
                            onPress={() => downloadDetectionResult(item)}
                            disabled={downloadLoading[item._id]}
                        >
                            {downloadLoading[item._id] ? (
                                <Ionicons name="sync" size={20} color="#fff" />
                            ) : (
                                <Ionicons name="download-outline" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* ===== IMAGE CONTENT ===== */}
                    {hasDetectionResult ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                    Original Image
                                </Text>
                                <Image
                                    source={{ uri: `${getUrl()}${item.imageUrl}` }}
                                    style={styles.historyImage}
                                />
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

                    {!!item.detectionResult?.explanation && (
                        <Text style={[styles.explanationText, { color: t.descriptionText }]}>
                            {item.detectionResult.explanation}
                        </Text>
                    )}
                </View>
            );
        }

        if (activeTab === "video") {
            const hasVideoDetection = item.detectionResult && item.detectionResult.resultVideo;
            
            return (
                <View style={[styles.historyCard, { backgroundColor: t.cardBg }]}>
                    <View style={styles.badgeContainer}>
                        <View
                            style={[
                                styles.badge,
                                {
                                    backgroundColor: hasVideoDetection ? "#7e0505" : "#0c710f"
                                },
                            ]}
                        >
                            <Text style={styles.badgeText}>
                                {hasVideoDetection ? "FAKE" : "REAL"}
                            </Text>
                        </View>
                    </View>

                    {/* Download button for fake videos */}
                    {hasVideoDetection && (
                        <TouchableOpacity 
                            style={styles.downloadButton}
                            onPress={() => {
                                Toast.show('Video download coming soon!');
                            }}
                        >
                            <Ionicons name="download-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}

                    <Text style={{ color: t.text }}>Video module history</Text>
                </View>
            );
        }

        return null;
    };

    return (
        <View style={[styles.container, { backgroundColor: t.background }]}>
            {/* Header with Filter Icon */}
            <View style={styles.header}>
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

                {/* Filter Button */}
                <TouchableOpacity 
                    style={[
                        styles.filterButton,
                        { backgroundColor: t.tabContainerBg }
                    ]}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons 
                        name="filter" 
                        size={20} 
                        color={t.text} 
                    />
                    <Text style={[styles.filterButtonText, { color: t.text }]}>
                        {getCurrentFilterLabel()}
                    </Text>
                    <Ionicons 
                        name="chevron-down" 
                        size={16} 
                        color={t.text} 
                    />
                </TouchableOpacity>
            </View>

            <FlatList
                data={getCurrentData()}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="albums-outline" size={48} color={t.emptyText} />
                        <Text style={{ color: t.emptyText, textAlign: 'center', marginTop: 10 }}>
                            No {getCurrentFilterLabel().toLowerCase()} history found.
                        </Text>
                    </View>
                )}
                showsVerticalScrollIndicator={false}
            />

            <FilterModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 15 },

    header: {
        paddingHorizontal: 12,
    },

    tabContainer: {
        flexDirection: "row",
        padding: 6,
        borderRadius: 12,
        marginBottom: 10,
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

    // Filter button styles
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '500',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        borderRadius: 16,
        padding: 16,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 4,
        gap: 12,
    },
    filterOptionText: {
        flex: 1,
        fontSize: 16,
    },

    historyCard: {
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
        position: "relative",
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
        marginBottom: 10,
    },

    // Badge styles
    badgeContainer: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 2,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },

    // Download button styles
    downloadButton: {
        backgroundColor: "#2563EB",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },

    // Tamper specific styles
    itemTimestamp: {
        fontSize: 12,
        marginBottom: 12,
    },

    tamperImagesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 8,
    },

    tamperImageWrapper: {
        flex: 1,
    },

    tamperHistoryImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },

    verificationContainer: {
        marginTop: 10,
    },

    verificationText: {
        fontSize: 14,
    },

    verificationMessage: {
        fontSize: 12,
    },
});