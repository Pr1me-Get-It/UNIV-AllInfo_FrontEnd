/* screen/NoticeScreen.jsx */

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlarmContext } from '../data/Alarm';
import { api } from '../api/client';
import { ALARM_DATA } from '../data/mockAlarms';
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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterMode, setFilterMode] = useState('all');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false); // 필터 모달 표시 여부
    const [selectedSources, setSelectedSources] = useState(Object.keys(SOURCE_LABELS));
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const handleCloseModal = () => {
        setModalSearchQuery(''); // 모달 닫을 때 검색어 초기화
        setFilterModalVisible(false); // 모달 숨기기
    };
    const toggleSource = (code) => {
        setSelectedSources(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code) // 이미 있으면 제거
                : [...prev, code]             // 없으면 추가
        );
    };
    const toggleAll = () => {
        const allCodes = Object.keys(SOURCE_LABELS);
        // 모든 학과가 이미 선택되어 있다면 -> 모두 해제
        if (selectedSources.length === allCodes.length) {
            setSelectedSources([]);
        } else {
            // 하나라도 비어있다면 -> 전체 포함 모든 학과 체크
            setSelectedSources(allCodes);
        }
    };

    const fetchMonthlyNotices = useCallback(async (keyword = '', isForceRefresh = false) => {
        /*
        if (!isForceRefresh && !keyword) {
            const cachedData = await getData(STORAGE_KEYS.NOTICE_CACHE);
            const cacheTime = await getData(STORAGE_KEYS.NOTICE_CACHE_TIME);

            if (
                cachedData &&
                cacheTime &&
                Date.now() - Number(cacheTime) < 3600000
            ) {
                console.log('🚀 캐시된 공지 사용');
                setData(cachedData);
                return; // 🔥 여기서 함수 종료
            }
        }*/

        // 2. 서버에서 데이터 가져오기 (기존 로직 유지)
        setLoading(true);
        let pageNum = 1;
        let allFetchedData = [];
        let shouldContinue = true;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        try {
            while (shouldContinue) {
                // 백엔드 명세에 맞게 파라미터 구성
                const params = {
                    p: pageNum,
                    order: 'DESC', // 최신순 정렬
                    limit: 20      // 한 페이지당 아이템 수
                };

                if (keyword) params.keyword = keyword;

                // [중요] 선택된 학과(source) 필터를 서버에 전달
                // 서버가 콤마로 구분된 문자열을 받는지, 배열을 받는지 확인이 필요합니다.
               
                const response = await api.get('/notice', { params }); //
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
                // 날짜 비교 및 limit 기반 종료 조건
                if (oldestInBatch < oneMonthAgo || safeNotices.length < 20) {
                    shouldContinue = false;
                } else {
                    pageNum++;
                }
            }
            setData(allFetchedData);
            // ... (캐시 저장 로직 생략)
        } catch (error) {
            console.error('데이터 조회 실패:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedSources]);

    useEffect(() => {
        setPage(1);
        fetchMonthlyNotices(query, true);
    }, [query, selectedSources]);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMonthlyNotices(nextPage, query, false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMonthlyNotices(query, true);
    };
    const normalizeSource = (source) => {
        if (!source) return null;
        const key = source.split('/')[0].toUpperCase().trim();

        // SOURCE_LABELS에 없는 값이면 null 처리
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
        // 학과 필터
        const sourcePrefix = normalizeSource(item.source);
        const matchesSourceFilter =
            selectedSources.length === 0 ||
            !sourcePrefix ||
            selectedSources.includes(sourcePrefix);

        // 상단 탭(전체/미확인) 필터
        const matchesReadFilter = filterMode === 'all' || !safeStatus[item.id];

        return matchesSourceFilter && matchesReadFilter;
    });

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                {/* 좌측 영역: 종 아이콘 + 알림함 텍스트 */}
                <View style={styles.headerLeft}>
                    <Ionicons name='notifications' size={28} color='rgba(50, 50, 50, 0.7)' />
                    <Text style={styles.headerText}>알림함</Text>
                </View>

                {/* 우측 영역: 필터 아이콘 추가 */}
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
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleCloseModal}
                            >
                                <Text style={styles.saveButtonText}>저장</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.filterList}>
                            {/* 1. '전체' 옵션 */}
                            {!modalSearchQuery && (
                                <TouchableOpacity
                                    style={[styles.filterItem, selectedSources.length === Object.keys(SOURCE_LABELS).length && styles.filterItemActive]}
                                    onPress={toggleAll} // 👈 전체 토글 함수 연결
                                >
                                    <View style={styles.filterItemContent}>
                                        <Text style={styles.filterItemText}>전체</Text>
                                        <Ionicons
                                            name={selectedSources.length === Object.keys(SOURCE_LABELS).length ? "checkbox" : "square-outline"}
                                            size={22}
                                            color={selectedSources.length === Object.keys(SOURCE_LABELS).length ? "rgb(219, 31, 38)" : "#ccc"}
                                        />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* 2. 학과 목록 */}
                            {Object.entries(SOURCE_LABELS)
                                .filter(([code, name]) => name.includes(modalSearchQuery))
                                .map(([code, name]) => {
                                    const isChecked = selectedSources.includes(code);
                                    return (
                                        <TouchableOpacity
                                            key={code}
                                            style={[styles.filterItem, isChecked && styles.filterItemActive]}
                                            onPress={() => toggleSource(code)} // 👈 개별 토글 함수 연결
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
                <Text style={styles.balanceText}>
                    {unreadCount} 개
                </Text>
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
                    style={[
                        styles.tabButton,
                        filterMode === 'all' && styles.tabButtonActive,
                    ]}
                    onPress={() => setFilterMode('all')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            filterMode === 'all' && styles.tabTextActive,
                        ]}
                    >
                        전체 알림
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        filterMode === 'unread' && styles.tabButtonActive,
                    ]}
                    onPress={() => setFilterMode('unread')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            filterMode === 'unread' && styles.tabTextActive,
                        ]}
                    >
                        미확인 알림
                    </Text>
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
                    ListEmptyComponent={
                        !loading && (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Text style={{ color: '#999' }}>
                                    {query ? '검색 결과가 없습니다.' : '알림이 없습니다.'}
                                </Text>
                            </View>
                        )
                    }

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

                                    <Text style={[
                                        styles.itemText,
                                        isRead && styles.readText
                                    ]} numberOfLines={1}>
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

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, backgroundColor: '#f5f5f5' },

    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 20 },
    headerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: 'rgba(50, 50, 50, 0.7)' },

    balanceContainer: { backgroundColor: 'rgb(219, 31, 38)', marginHorizontal: 20, marginBottom: 15, padding: 10, borderRadius: 15, alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
    balanceText: { color: 'white', fontSize: 28, fontWeight: 'bold' },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 10,
        paddingHorizontal: 15,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchInput: { flex: 1, fontSize: 16, color: '#333' },

    listContainer: { flex: 1, backgroundColor: 'white', borderRadius: 20, marginHorizontal: 20, marginBottom: 110, paddingVertical: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(238, 238, 238, 1)' },

    iconBackground: { backgroundColor: 'transparent', width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    customIcon: { width: 40, height: 40, resizeMode: 'contain' },

    textWrapper: { flex: 1 },

    sourceText: { fontSize: 12, color: 'rgb(219, 31, 38)', fontWeight: 'bold', marginBottom: 2 },
    itemText: { fontSize: 16, color: '#333', fontWeight: '500', marginBottom: 4 },
    readText: { color: '#aaa' },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#888' },

    unreadLabel: { fontSize: 12, color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
    readLabel: { fontSize: 12, color: '#bbb', fontWeight: 'normal' },

    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 999,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        borderRadius: 999,
    },
    tabButtonActive: {
        backgroundColor: 'rgba(219, 31, 38, 0.08)',
    },
    tabText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    tabTextActive: {
        color: 'rgb(219, 31, 38)',
        fontWeight: '700',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // 양 끝으로 배치
        marginBottom: 12,
        paddingHorizontal: 20 // 기존 marginLeft 대신 전체 패딩 적용
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
        color: 'rgba(50, 50, 50, 0.7)'
    },
    filterIconButton: {
        padding: 5, // 터치 영역 확보

    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // 반투명 배경
        justifyContent: 'flex-end', // 아래쪽 정렬
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '60%', // 화면의 60% 높이
        padding: 20,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    filterList: {
        flex: 1,
    },
    filterItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    filterItemActive: {
        backgroundColor: 'rgba(219, 31, 38, 0.05)',
    },
    filterItemText: {
        fontSize: 16,
        color: '#333',
    },
    filterItemTextActive: {
        color: 'rgb(219, 31, 38)',
        fontWeight: 'bold',
    },
    /* styles 객체 수정 및 추가 */

    sheetHeader: {
        flexDirection: 'row', // 가로 정렬
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    modalSearchBox: {
        flex: 1, // 중간 영역 가득 채우기
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginRight: 10,
        height: 40,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 5,
        padding: 0, // 안드로이드 수직 패딩 제거
    },
    saveButton: {
        backgroundColor: 'rgb(219, 31, 38)', // 프로젝트 메인 레드 컬러 적용
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white', // 흰색 글씨
        fontWeight: 'bold',
        fontSize: 14,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        justifyContent: 'space-between', // 요소 간 간격 조절
    },
    filterItem: {
        paddingVertical: 12, // 패딩 살짝 조정
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
        paddingHorizontal: 5,
    },
    filterItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between', // 글자는 왼쪽, 체크박스는 오른쪽
        alignItems: 'center',
    },
});