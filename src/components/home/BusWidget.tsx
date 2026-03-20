import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppText from '../AppText';
import { COLORS } from '../../constants/colors';
import { moderateScale } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import {
    fetchMultipleStationArrivals,
    formatArrivalTime,
    DEFAULT_STATION_IDS,
    BusArrivalResult,
    BusArrivalItem,
} from '../../api/busService';

export default function BusWidget() {
    const [arrivals, setArrivals] = useState<BusArrivalResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [selectedStationId, setSelectedStationId] = useState<string>(DEFAULT_STATION_IDS[0]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [favoriteStationId, setFavoriteStationId] = useState<string | null>(null);

    useEffect(() => {
        const loadFav = async () => {
            try {
                const fav = await AsyncStorage.getItem('FAVORITE_BUS_STATION');
                if (fav) {
                    setFavoriteStationId(fav);
                    setSelectedStationId(fav);
                }
            } catch (e) {}
        };
        loadFav();
    }, []);

    const toggleFavorite = async (stationId: string) => {
        try {
            if (favoriteStationId === stationId) {
                await AsyncStorage.removeItem('FAVORITE_BUS_STATION');
                setFavoriteStationId(null);
            } else {
                await AsyncStorage.setItem('FAVORITE_BUS_STATION', stationId);
                setFavoriteStationId(stationId);
            }
        } catch (e) {}
    };

    const loadArrivals = useCallback(async () => {
        try {
            setError(null);
            const data = await fetchMultipleStationArrivals(DEFAULT_STATION_IDS);
            setArrivals(data);
            setLastUpdated(new Date());
            console.log('[BusWidget] 도착 정보 갱신 완료:', data.length, '개 정류장');
        } catch (err) {
            console.error('[BusWidget] 도착 정보 조회 실패:', err);
            setError('버스 정보를 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 마운트 시 + 5분마다 자동 갱신 (일일 트래픽 1000회 제한 고려)
    useEffect(() => {
        loadArrivals();
        const interval = setInterval(loadArrivals, 5 * 60_000);
        return () => clearInterval(interval);
    }, [loadArrivals]);

    const renderBusItem = (item: BusArrivalItem, index: number) => (
        <View key={`${item.routeNo}-${index}`} style={styles.busItem}>
            <View style={styles.busInfoLeft}>
                <View style={styles.busIconWrapper}>
                    <Ionicons name="bus" size={20} color="#2196F3" />
                </View>
                <View>
                    <AppText style={styles.routeName}>{item.routeNo}번</AppText>
                    {item.directionDst ? (
                        <AppText style={styles.destination}>{item.directionDst} 방면</AppText>
                    ) : null}
                </View>
            </View>
            <View style={styles.busInfoRight}>
                <AppText style={styles.arrivalEstimate}>
                    {formatArrivalTime(item.arrtime)}
                </AppText>
                <AppText style={styles.remainingStops}>{item.stopCnt}번째 전</AppText>
            </View>
        </View>
    );

    const selectedStationData = arrivals.find((s) => s.stationId === selectedStationId);
    const displayArrivals: BusArrivalItem[] = selectedStationData
        ? [...selectedStationData.arrivals].slice(0, 5) // 해당 정류장 버스 최대 5개 표시
        : [];

    const updatedTime = lastUpdated
        ? `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')} 기준`
        : '';

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>시내 버스</AppText>
                <TouchableOpacity style={styles.refreshButton} onPress={loadArrivals} disabled={isLoading}>
                    <Ionicons
                        name="refresh"
                        size={16}
                        color={isLoading ? '#ccc' : '#6B7280'}
                        style={isLoading ? styles.spinning : undefined}
                    />
                    {updatedTime ? (
                        <AppText style={styles.updatedTime}>{updatedTime}</AppText>
                    ) : null}
                </TouchableOpacity>
            </View>

            {/* 선택된 정류장 드롭다운 버튼 */}
            {!isLoading && !error && arrivals.length > 0 && selectedStationData && (
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setIsModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.dropdownInner}>
                        <AppText style={styles.dropdownText}>{selectedStationData.stationName}</AppText>
                        {favoriteStationId === selectedStationId && <Ionicons name="star" size={16} color="#F59E0B" style={{ marginLeft: 6 }} />}
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
            )}

            <View style={[styles.card, arrivals.length > 0 && selectedStationData && styles.cardWithDropdown]}>
                {isLoading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <AppText style={styles.loadingText}>버스 정보 불러오는 중...</AppText>
                    </View>
                ) : error ? (
                    <View style={styles.centerBox}>
                        <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
                        <AppText style={styles.errorText}>{error}</AppText>
                        <TouchableOpacity style={styles.retryButton} onPress={loadArrivals}>
                            <AppText style={styles.retryText}>다시 시도</AppText>
                        </TouchableOpacity>
                    </View>
                ) : displayArrivals.length > 0 ? (
                    <View style={styles.listContainer}>
                        {displayArrivals.map((item, i) => renderBusItem(item, i))}
                    </View>
                ) : (
                    <View style={styles.centerBox}>
                        <Ionicons name="bus-outline" size={28} color="#D1D5DB" />
                        <AppText style={styles.emptyText}>현재 버스 도착 정보가 없습니다.</AppText>
                    </View>
                )}
            </View>

            <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText style={styles.modalTitle}>정류장 선택</AppText>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#111" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.stationList}>
                            {arrivals.map(station => {
                                const isFav = station.stationId === favoriteStationId;
                                const isSelected = station.stationId === selectedStationId;
                                return (
                                    <TouchableOpacity
                                        key={station.stationId}
                                        style={[styles.stationRow, isSelected && styles.stationRowActive]}
                                        onPress={() => {
                                            setSelectedStationId(station.stationId);
                                            setIsModalVisible(false);
                                        }}
                                    >
                                        <AppText style={[styles.stationRowText, isSelected && styles.stationRowTextActive]}>
                                            {station.stationName}
                                        </AppText>
                                        <TouchableOpacity 
                                            style={styles.favToggleBtn}
                                            onPress={(e) => { e.stopPropagation(); toggleFavorite(station.stationId); }}
                                        >
                                            <Ionicons name={isFav ? "star" : "star-outline"} size={22} color={isFav ? "#F59E0B" : "#D1D5DB"} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 30 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: moderateScale(20, 0.3),
        fontWeight: 'bold',
        color: '#111',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    updatedTime: {
        fontSize: moderateScale(11, 0.3),
        color: '#9CA3AF',
    },
    spinning: { opacity: 0.4 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        minHeight: 80,
    },
    cardWithDropdown: {
        borderTopWidth: 1,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    dropdownInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: moderateScale(15, 0.3),
        fontWeight: 'bold',
        color: '#111',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: moderateScale(18, 0.3),
        fontWeight: 'bold',
        color: '#111',
    },
    stationList: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    stationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stationRowActive: {
        backgroundColor: 'rgba(33, 150, 243, 0.05)',
        borderRadius: 12,
        borderBottomWidth: 0,
    },
    stationRowText: {
        fontSize: moderateScale(15, 0.3),
        color: '#374151',
    },
    stationRowTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    favToggleBtn: {
        padding: 4,
    },
    listContainer: { gap: 16 },
    busItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    busInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    busIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    routeName: {
        fontSize: moderateScale(16, 0.3),
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 2,
    },
    destination: {
        fontSize: moderateScale(12, 0.3),
        color: '#6B7280',
    },
    busInfoRight: { alignItems: 'flex-end' },
    arrivalEstimate: {
        fontSize: moderateScale(15, 0.3),
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    remainingStops: {
        fontSize: moderateScale(11, 0.3),
        color: '#9CA3AF',
    },
    centerBox: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loadingText: {
        fontSize: moderateScale(13, 0.3),
        color: '#9CA3AF',
    },
    errorText: {
        fontSize: moderateScale(13, 0.3),
        color: '#EF4444',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    retryText: {
        fontSize: moderateScale(13, 0.3),
        color: '#374151',
        fontWeight: '600',
    },
    emptyText: {
        fontSize: moderateScale(13, 0.3),
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
