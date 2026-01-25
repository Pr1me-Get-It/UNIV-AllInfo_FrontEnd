/* screen/NoticeScreen.jsx */

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Image, TextInput, ActivityIndicator, Modal, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlarmContext } from '../data/Alarm';
import { api } from '../api/client';
import SOURCE_LABELS from '../constants/labeltag.json';
import { saveData, getData } from '../utils/storage'; 
import { STORAGE_KEYS } from '../constants/storageKeys';

const DEFAULT_IMAGE = require('../assets/knu.png');

export default function NoticeScreen({ navigation }) {
    const { readStatus } = useContext(AlarmContext) || { readStatus: {} };
    const safeStatus = readStatus || {};

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [filterMode, setFilterMode] = useState('all');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState('');

    // 학과 코드 목록 상태 (초기값은 빈 배열)
    const [selectedSources, setSelectedSources] = useState([]);

    // 1. 앱 시작 시 저장된 필터 데이터 불러오기
    useEffect(() => {
        const initFilters = async () => {
            try {
                // 키값이 undefined 인지 체크 (안전 장치)
                const filterKey = STORAGE_KEYS.FILTER_SETTINGS || 'filter_settings';
                const saved = await getData(filterKey);
                
                if (saved && Array.isArray(saved) && saved.length > 0) {
                    setSelectedSources(saved);
                } else {
                    // 저장된 데이터가 없으면 '전체 선택'을 기본값으로 함
                    setSelectedSources(Object.keys(SOURCE_LABELS));
                }
            } catch (e) {
                console.error("필터 로딩 에러:", e);
                setSelectedSources(Object.keys(SOURCE_LABELS));
            }
        };
        initFilters();
    }, []);

    // 필터 상태가 바뀔 때마다 저장하는 함수
    const persistFilters = async (newList) => {
        try {
            const filterKey = STORAGE_KEYS.FILTER_SETTINGS || 'filter_settings';
            await saveData(filterKey, newList);
        } catch (e) {
            console.error("필터 저장 에러:", e);
        }
    };

    const handleCloseModal = () => {
        setModalSearchQuery('');
        setFilterModalVisible(false);
    };

    // 개별 학과 토글
    const toggleSource = (code) => {
        const updated = selectedSources.includes(code)
            ? selectedSources.filter(c => c !== code)
            : [...selectedSources, code];
        
        setSelectedSources(updated);
        persistFilters(updated); 
    };

    // 전체 선택/해제 토글
    const toggleAll = () => {
        const allCodes = Object.keys(SOURCE_LABELS);
        const updated = selectedSources.length === allCodes.length ? [] : allCodes;
        
        setSelectedSources(updated);
        persistFilters(updated); 
    };

    const fetchMonthlyNotices = useCallback(async (keyword = '') => {
        setLoading(true);
        let pageNum = 1;
        let allFetchedData = [];
        let shouldContinue = true;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        try {
            while (shouldContinue) {
                const params = { p: pageNum, order: 'DESC', limit: 20 };
                if (keyword) params.keyword = keyword;
               
                const response = await api.get('/notice', { params });
                const rawData = response.data;
                const safeNotices = Array.isArray(rawData) ? rawData : [];

                if (safeNotices.length === 0) break;

                const processedBatch = safeNotices.map(item => ({
                    ...item,
                    id: item.notice_id,
                    displaySource: SOURCE_LABELS[item.source?.split('/')[0]] || item.source,
                    date: item.posted_at ? item.posted_at.split('T')[0] : '',
                    image: DEFAULT_IMAGE,
                }));

                allFetchedData = [...allFetchedData, ...processedBatch];
                const oldestInBatch = new Date(safeNotices[safeNotices.length - 1].posted_at);
                
                if (oldestInBatch < oneMonthAgo || safeNotices.length < 20) {
                    shouldContinue = false;
                } else {
                    pageNum++;
                }
            }
            setData(allFetchedData);
        } catch (error) {
            console.error('데이터 조회 실패:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMonthlyNotices(query);
    }, [query, fetchMonthlyNotices]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMonthlyNotices(query);
    };

    const normalizeSource = (source) => {
        if (!source) return null;
        const key = source.split('/')[0].toUpperCase().trim();
        return SOURCE_LABELS[key] ? key : null;
    };

    const unreadCount = data.filter(item => {
        const sourcePrefix = normalizeSource(item.source);
        return (
            (!sourcePrefix || selectedSources.includes(sourcePrefix)) &&
            !safeStatus[item.id]
        );
    }).length;

    const displayedData = data.filter(item => {
        const sourcePrefix = normalizeSource(item.source);
        const matchesSourceFilter =
            selectedSources.length === 0 ||
            !sourcePrefix ||
            selectedSources.includes(sourcePrefix);

        const matchesReadFilter = filterMode === 'all' || !safeStatus[item.id];
        return matchesSourceFilter && matchesReadFilter;
    });

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <Ionicons name='notifications' size={28} color='rgba(50, 50, 50, 0.7)' />
                    <Text style={styles.headerText}>알림함</Text>
                </View>

                <TouchableOpacity
                    style={styles.filterIconButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="filter-outline" size={24} color="rgba(50, 50, 50, 0.7)" />
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isFilterModalVisible}
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>학과 필터</Text>
                            <View style={styles.modalSearchBox}>
                                <Ionicons name="search" size={16} color="#888" />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="학과명 검색..."
                                    value={modalSearchQuery}
                                    onChangeText={setModalSearchQuery}
                                    placeholderTextColor="#aaa"
                                />
                                {modalSearchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#ccc" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity style={styles.saveButton} onPress={handleCloseModal}>
                                <Text style={styles.saveButtonText}>저장</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.filterList}>
                            {!modalSearchQuery && (
                                <TouchableOpacity
                                    style={[styles.filterItem, selectedSources.length === Object.keys(SOURCE_LABELS).length && styles.filterItemActive]}
                                    onPress={toggleAll}
                                >
                                    <View style={styles.filterItemContent}>
                                        <Text style={styles.filterItemText}>전체 선택</Text>
                                        <Ionicons
                                            name={selectedSources.length === Object.keys(SOURCE_LABELS).length ? "checkbox" : "square-outline"}
                                            size={22}
                                            color={selectedSources.length === Object.keys(SOURCE_LABELS).length ? "rgb(219, 31, 38)" : "#ccc"}
                                        />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {Object.entries(SOURCE_LABELS)
                                .filter(([code, name]) => name.includes(modalSearchQuery))
                                .map(([code, name]) => {
                                    const isChecked = selectedSources.includes(code);
                                    return (
                                        <TouchableOpacity
                                            key={code}
                                            style={[styles.filterItem, isChecked && styles.filterItemActive]}
                                            onPress={() => toggleSource(code)}
                                        >
                                            <View style={styles.filterItemContent}>
                                                <Text style={[styles.filterItemText, isChecked && styles.filterItemTextActive]}>{name}</Text>
                                                <Ionicons
                                                    name={isChecked ? "checkbox" : "square-outline"}
                                                    size={22}
                                                    color={isChecked ? "rgb(219, 31, 38)" : "#ccc"}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>확인하지 않은 알림</Text>
                <Text style={styles.balanceText}>{unreadCount} 개</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="알림 제목 검색..."
                    placeholderTextColor="#999"
                    value={query}
                    onChangeText={setQuery}
                    style={styles.searchInput}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, filterMode === 'all' && styles.tabButtonActive]}
                    onPress={() => setFilterMode('all')}
                >
                    <Text style={[styles.tabText, filterMode === 'all' && styles.tabTextActive]}>전체 알림</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, filterMode === 'unread' && styles.tabButtonActive]}
                    onPress={() => setFilterMode('unread')}
                >
                    <Text style={[styles.tabText, filterMode === 'unread' && styles.tabTextActive]}>미확인 알림</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    data={displayedData}
                    keyExtractor={(item) => String(item.id)}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    ListFooterComponent={loading && !refreshing ? <ActivityIndicator style={{ margin: 10 }} /> : null}
                    renderItem={({ item }) => {
                        const isRead = safeStatus[item.id] === true;
                        return (
                            <TouchableOpacity
                                style={styles.itemRow}
                                onPress={() => navigation.navigate('Detail', { item })}
                            >
                                <View style={styles.iconBackground}>
                                    <Image source={item.image} style={styles.customIcon} />
                                </View>

                                <View style={styles.textWrapper}>
                                    <Text style={styles.sourceText}>{item.displaySource}</Text>
                                    <Text style={[styles.itemText, isRead && styles.readText]} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.dateText}>{item.date}</Text>
                                        {isRead ? (
                                            <Text style={styles.readLabel}>읽음</Text>
                                        ) : (
                                            <Text style={styles.unreadLabel}>NEW</Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );
}

// ... 스타일 정의는 이전과 동일함 (생략)
const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, backgroundColor: '#f5f5f5' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: 'rgba(50, 50, 50, 0.7)' },
    filterIconButton: { padding: 5 },
    balanceContainer: { backgroundColor: 'rgb(219, 31, 38)', marginHorizontal: 20, marginBottom: 15, padding: 10, borderRadius: 15, alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
    balanceText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 15, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
    searchInput: { flex: 1, fontSize: 16, color: '#333' },
    listContainer: { flex: 1, backgroundColor: 'white', borderRadius: 20, marginHorizontal: 20, marginBottom: 110, paddingVertical: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(238, 238, 238, 1)' },
    iconBackground: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    customIcon: { width: 30, height: 30, resizeMode: 'contain' },
    textWrapper: { flex: 1 },
    sourceText: { fontSize: 10, color: 'rgb(219, 31, 38)', fontWeight: 'bold', marginBottom: 2 },
    itemText: { fontSize: 14, color: '#333', fontWeight: '500', marginBottom: 4 },
    readText: { color: '#aaa' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#888' },
    unreadLabel: { fontSize: 12, color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
    readLabel: { fontSize: 12, color: '#bbb', fontWeight: 'normal' },
    tabsContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 999, padding: 4, borderWidth: 1, borderColor: '#e0e0e0' },
    tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 999 },
    tabButtonActive: { backgroundColor: 'rgba(219, 31, 38, 0.08)' },
    tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    tabTextActive: { color: 'rgb(219, 31, 38)', fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', padding: 20 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', justifyContent: 'space-between' },
    sheetTitle: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
    modalSearchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, marginRight: 10, height: 40 },
    modalSearchInput: { flex: 1, fontSize: 14, color: '#333', marginLeft: 5 },
    saveButton: { backgroundColor: 'rgb(219, 31, 38)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    filterList: { flex: 1 },
    filterItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingHorizontal: 5 },
    filterItemActive: { backgroundColor: 'rgba(219, 31, 38, 0.05)' },
    filterItemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    filterItemText: { fontSize: 16, color: '#333' },
    filterItemTextActive: { color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
});