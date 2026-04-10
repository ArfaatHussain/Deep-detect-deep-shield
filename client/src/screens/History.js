import React, { useCallback, useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { getHistory } from "../service/userService";
import { loadUser } from "../utils/loadUser";
import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import Toast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

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
            setImageHistory(response.data.imageHistory || []);
            setVideoHistory(response.data.videoHistory || []);
            setTamperGenerationHistory(response.data.tamperGenerationHistory || []);
            setTamperVerificationHistory(response.data.tamperVerificationHistory || []);
        } catch (error) {
            setImageHistory([]);
            setVideoHistory([]);
            setTamperGenerationHistory([]);
            setTamperVerificationHistory([])
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

    // Download function for detection result images & videos
    const downloadDetectionResult = async (item) => {
        const imageUrl = item?.detectionResult?.resultImage;
        const videoUrl = item?.detectionResult?.resultVideo;

        if (!imageUrl && !videoUrl) {
            Toast.show("No media available to download");
            return;
        }

        try {
            setDownloadLoading(prev => ({ ...prev, [item._id]: true }));

            // Request permission
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== "granted") {
                Toast.show("Please allow media access to download.");
                return;
            }

            // Decide which file to download
            const mediaUrl = videoUrl || imageUrl;

            // Extract filename (Cloudinary URLs usually already have extension)
            const fileName = mediaUrl.split('/').pop();
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            // Download file
            const { uri } = await FileSystem.downloadAsync(
                `${mediaUrl}`,
                fileUri
            );

            // Save to gallery
            await MediaLibrary.createAssetAsync(uri);

            Toast.show(videoUrl ? "Video saved to gallery" : "Image saved to gallery");

        } catch (error) {
            console.error("Download error:", error);
            Toast.show("Failed to download media");
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

    const renderTamperItem = ({ item }) => {
        const isProtect = tamperGenerationHistory.some(genItem => genItem._id === item._id);

        // Function to download protected image (only for protect items)
        const downloadProtectedImage = async (item) => {
            const imageUrl = item.protectedImageUrl;
            
            if (!imageUrl) {
                Toast.show("No protected image available to download");
                return;
            }

            try {
                setDownloadLoading(prev => ({ ...prev, [item._id]: true }));

                // Request permission
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== "granted") {
                    Toast.show("Please allow media access to download.");
                    return;
                }

                // Extract filename from URL
                const fileName = imageUrl.split('/').pop();
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;

                // Download file
                const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

                // Save to gallery
                await MediaLibrary.createAssetAsync(uri);

                Toast.show("Protected image saved to gallery");

            } catch (error) {
                console.error("Download error:", error);
                Toast.show("Failed to download protected image");
            } finally {
                setDownloadLoading(prev => ({ ...prev, [item._id]: false }));
            }
        };

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
                {isProtect ? (
                    // PROTECT items: Show two images side by side
                    <View style={styles.tamperImagesContainer}>
                        <View style={styles.tamperImageWrapper}>
                            <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                Uploaded Image
                            </Text>
                            <Image
                                source={{ uri: `${item.originalImageUrl}`}}
                                style={styles.tamperHistoryImage}
                                resizeMode="contain"
                                onError={(error) => console.log("Image loading error:", error.nativeEvent.error)}
                            />
                        </View>

                        <View style={styles.tamperImageWrapper}>
                            <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                Protected Image
                            </Text>
                            <Image
                                source={{ uri: `${item.protectedImageUrl}` }}
                                style={styles.tamperHistoryImage}
                                resizeMode="contain"
                                onError={(error) => console.log("Result image loading error:", error.nativeEvent.error)}
                            />
                        </View>
                    </View>
                ) : (
                    // VERIFY items: Show single uploaded image
                    <View>
                        <Text style={[styles.imageLabel, { color: t.labelText }]}>
                            Uploaded Image
                        </Text>
                        <Image
                            source={{ uri: `${item.imageUrl}` }}
                            style={[styles.tamperHistoryImage, { width: '100%' }]}
                            resizeMode="contain"
                            onError={(error) => console.log("Image loading error:", error.nativeEvent.error)}
                        />
                    </View>
                )}

                {/* Verification Result (for verify items only) - Combined Status */}
                {!isProtect && (
                    <>
                        <View style={[styles.verificationContainer, {
                            backgroundColor: item.tampered ? '#FEE2E2' : '#D1FAE5',
                            borderColor: item.tampered ? '#7e0505' : '#0c710f',
                            borderWidth: 1,
                            borderRadius: 8,
                            padding: 10,
                            marginTop: 10,
                        }]}>
                            {/* Combined Status Rows in one container */}
                            <View style={styles.tamperStatusRow}>
                                <Icon
                                    name={item.tampered ? 'close-circle' : 'checkmark-circle'}
                                    size={16}
                                    color={item.tampered ? '#B91C1C' : '#047857'}
                                />
                                <Text style={[styles.tamperStatusText, { color: item.tampered ? '#B91C1C' : '#047857' }]}>
                                    {item.tampered ? 'Tampered' : 'Authentic'}
                                </Text>
                                
                                <View style={styles.statusDivider} />
                                
                                <Icon
                                    name={item.watermarkedMatched ? 'shield-checkmark' : 'shield-outline'}
                                    size={16}
                                    color={item.watermarkedMatched ? '#047857' : '#B91C1C'}
                                />
                                <Text style={[styles.tamperStatusText, { color: item.watermarkedMatched ? '#047857' : '#B91C1C' }]}>
                                    {item.watermarkedMatched ? 'Watermark Matched' : 'Watermark Not Matched'}
                                </Text>
                            </View>
                        </View>

                        {/* Verification result message if available */}
                        {item.verificationResult && item.verificationResult.message && (
                            <Text style={[styles.verificationMessage, { color: t.descriptionText, marginTop: 8 }]}>
                                {item.verificationResult.message}
                            </Text>
                        )}
                    </>
                )}

                {/* Download button for PROTECT items only */}
                {isProtect && (
                    <TouchableOpacity
                        style={[styles.downloadButton, { position: 'relative', marginTop: 10, alignSelf: 'flex-end' }]}
                        onPress={() => downloadProtectedImage(item)}
                        disabled={downloadLoading[item._id]}
                    >
                        {downloadLoading[item._id] ? (
                            <Ionicons name="sync" size={20} color="#fff" />
                        ) : (
                            <Ionicons name="download-outline" size={20} color="#fff" />
                        )}
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

                    {/* Timestamp */}
                    <Text style={[styles.itemTimestamp, { color: t.descriptionText }]}>
                        {new Date(item.createdAt).toLocaleString()}
                    </Text>

                    {/* ===== DOWNLOAD ICON FOR FAKE ITEMS ===== */}
                    {hasDetectionResult && (
                        <TouchableOpacity
                            style={[styles.downloadButton, { position: 'absolute', bottom: 8, right: 10 }]}
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
                                    Uploaded Image
                                </Text>
                                <Image
                                    source={{ uri: `${item.imageUrl}` }}
                                    style={styles.historyImage}
                                />
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                    Detection Result
                                </Text>
                                <Image
                                    source={{ uri: `${item.detectionResult.resultImage}` }}
                                    style={styles.historyImage}
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={[styles.imageLabel, { color: t.labelText }]}>
                                Uploaded Image
                            </Text>
                            <Image
                                source={{ uri: `${item.imageUrl}` }}
                                style={[styles.historyImage, { width: '100%' }]}
                            />
                        </>
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
            const hasVideoDetection = item.detectionResult &&
                Object.keys(item.detectionResult).length > 0 &&
                item.detectionResult.resultVideo;

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
                                    backgroundColor: hasVideoDetection ? "#7e0505" : "#0c710f"
                                },
                            ]}
                        >
                            <Text style={styles.badgeText}>
                                {hasVideoDetection ? "FAKE" : "REAL"}
                            </Text>
                        </View>
                    </View>

                    {/* Timestamp */}
                    <Text style={[styles.itemTimestamp, { color: t.descriptionText }]}>
                        {new Date(item.createdAt).toLocaleString()}
                    </Text>

                    {/* ===== DOWNLOAD ICON FOR FAKE VIDEOS ===== */}
                    {hasVideoDetection && (
                        <TouchableOpacity
                            style={[styles.downloadButton, { position: 'absolute', bottom: 8, right: 10 }]}
                            onPress={() => downloadDetectionResult(item)}
                            disabled={downloadLoading[item._id]}
                        >
                            {downloadLoading[item._id] ? (
                                <Ionicons name="sync" size={24} color="#fff" />
                            ) : (
                                <Ionicons name="download-outline" size={24} color="#fff" />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* ===== VIDEO CONTENT ===== */}
                    {hasVideoDetection ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={[styles.videoLabel, { color: t.labelText }]}>
                                    Uploaded Video
                                </Text>
                                <Video
                                    source={{ uri: `${item.videoUrl}` }}
                                    style={styles.historyVideo}
                                    controls={true}
                                    paused={true}
                                />
                            </View>

                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={[styles.videoLabel, { color: t.labelText }]}>
                                    Detection Result
                                </Text>
                                <Video
                                    source={{ uri: `${item.detectionResult.resultVideo}` }}
                                    style={styles.historyVideo}
                                    controls={true}
                                    paused={true}
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={[styles.videoLabel, { color: t.labelText }]}>
                                Uploaded Video
                            </Text>
                            <View style={styles.singleVideoContainer}>
                                <Video
                                    source={{ uri: `${item.videoUrl}` }}
                                    style={[styles.historyVideo]}
                                    controls={true}
                                    paused={true}
                                />
                            </View>
                        </>
                    )}

                    {!!item.detectionResult?.explanation && (
                        <Text style={[styles.explanationText, { color: t.descriptionText }]}>
                            {item.detectionResult.explanation}
                        </Text>
                    )}
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
        width: 40,
        height: 40,
        borderRadius: 28,
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
    
    statusDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginHorizontal: 10,
    },
    
    tamperStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    
    tamperStatusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    
    videoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 6,
        textAlign: 'center',
    },
    
    historyVideo: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        backgroundColor: '#000',
    },
    
    singleVideoContainer: {
        position: 'relative',
        width: '100%',
    },
});