import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import AppText from '../AppText';
import { COLORS } from '../../constants/colors';
import { MOCK_BUSES, BusInfo } from '../../data/mockHomeData';
import { moderateScale } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'shuttle' | 'city';

export default function BusWidget() {
    const [activeTab, setActiveTab] = useState<TabType>('shuttle');

    const filteredBuses = MOCK_BUSES.filter(bus => bus.type === activeTab);

    const renderBusItem = (bus: BusInfo) => {
        return (
            <View key={bus.id} style={styles.busItem}>
                <View style={styles.busInfoLeft}>
                    <View style={[styles.busIconWrapper, { backgroundColor: activeTab === 'shuttle' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)' }]}>
                        <Ionicons name="bus" size={20} color={activeTab === 'shuttle' ? '#4CAF50' : '#2196F3'} />
                    </View>
                    <View>
                        <AppText style={styles.routeName}>{bus.routeName}</AppText>
                        <AppText style={styles.destination}>{bus.destination} 방면</AppText>
                    </View>
                </View>

                <View style={styles.busInfoRight}>
                    <AppText style={styles.arrivalEstimate}>{bus.arrivalEstimate}</AppText>
                    {bus.remainingStops && (
                        <AppText style={styles.remainingStops}>{bus.remainingStops}</AppText>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>캠퍼스 이동</AppText>
                <TouchableOpacity style={styles.moreButton}>
                    <AppText style={styles.moreButtonText}>시간표 보기</AppText>
                    <Ionicons name="chevron-forward" size={14} color="#6B7280" />
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                {/* Custom Tab Bar */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'shuttle' && styles.activeTabButton]}
                        onPress={() => setActiveTab('shuttle')}
                    >
                        <AppText style={[styles.tabText, activeTab === 'shuttle' && styles.activeTabText]}>
                            순환 셔틀
                        </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'city' && styles.activeTabButton]}
                        onPress={() => setActiveTab('city')}
                    >
                        <AppText style={[styles.tabText, activeTab === 'city' && styles.activeTabText]}>
                            시내 버스
                        </AppText>
                    </TouchableOpacity>
                </View>

                {/* Bus List */}
                <View style={styles.listContainer}>
                    {filteredBuses.length > 0 ? (
                        filteredBuses.map(renderBusItem)
                    ) : (
                        <AppText style={styles.emptyText}>운행 중인 차량이 없습니다.</AppText>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
    },
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
    moreButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moreButtonText: {
        fontSize: moderateScale(13, 0.3),
        color: '#6B7280',
        marginRight: 2,
    },
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
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    tabText: {
        fontSize: moderateScale(14, 0.3),
        color: '#6B7280',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#111',
        fontWeight: 'bold',
    },
    listContainer: {
        gap: 16, // spacing between items
    },
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
    busInfoRight: {
        alignItems: 'flex-end',
    },
    arrivalEstimate: {
        fontSize: moderateScale(16, 0.3),
        fontWeight: 'bold',
        color: COLORS.primary, // Red/Pink accent for ETA
        marginBottom: 2,
    },
    remainingStops: {
        fontSize: moderateScale(12, 0.3),
        color: '#9CA3AF',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        paddingVertical: 20,
    }
});
