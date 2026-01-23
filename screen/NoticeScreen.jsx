/* screen/HomeScreen.jsx */

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlarmContext } from '../data/Alarm';
import { api } from '../api/client';
import { ALARM_DATA } from '../data/mockAlarms';
import  SOURCE_LABELS  from '../constants/labeltag.json';

const DEFAULT_IMAGE = require('../assets/knu.png');

export default function HomeScreen({ navigation }) {
    const { readStatus } = useContext(AlarmContext) || { readStatus: {} };
    const safeStatus = readStatus || {};

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterMode, setFilterMode] = useState('all');

    const fetchNotices = useCallback(async (pageNum, keyword = '', shouldRefresh = false) => {
        if (!shouldRefresh && loading) return;

        setLoading(true);
        try {
            const params = { p: pageNum };
            if (keyword) params.keyword = keyword;

            const response = await api.get('/notice', { params });

            // 1. 데이터 구조 수정: 백엔드 응답이 객체가 아닌 '배열'임
            const rawData = response.data;
            const safeNotices = Array.isArray(rawData) ? rawData : [];

            // 2. 필드 이름 매핑: UI에서 사용하는 id, date 이름에 맞춰 변환
            const noticesWithImage = safeNotices.map(item => {
                // 1. 소스 문자열에서 접두사 추출 (예: 'CSE/bbs/...' -> 'CSE')
                const sourcePrefix = item.source ? item.source.split('/')[0] : '';

                return {
                    ...item,
                    id: item.notice_id, // notice_id를 id로 매핑
                    // 2. 매핑 테이블에서 이름을 가져오고, 없으면 원본 소스 표시
                    displaySource: SOURCE_LABELS[sourcePrefix] || item.source,
                    date: item.posted_at ? item.posted_at.split('T')[0] : '', // ISO 날짜 가공
                    image: DEFAULT_IMAGE,
                };
            });

            if (shouldRefresh) {
                setData(noticesWithImage);
            } else {
                setData(prev => [...prev, ...noticesWithImage]);
            }

            // 3. 페이지네이션 판별 로직 (15개 단위)
            setHasMore(safeNotices.length === 15);

        } catch (error) {
            console.error('공지사항 조회 실패:', error);
            // ... (에러 시 목업 데이터 사용 로직 유지)
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loading]);

    useEffect(() => {
        setPage(1);
        fetchNotices(1, query, true);
    }, [query]);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotices(nextPage, query, false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchNotices(1, query, true);
    };

    const unreadCount = data.filter(item => !safeStatus[item.id]).length;

    const displayedData = filterMode === 'all'
        ? data
        : data.filter(item => !safeStatus[item.id]);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Ionicons name='notifications' size={28} color='rgba(50, 50, 50, 0.7)' />
                <Text style={styles.headerText}>알림함</Text>
            </View>

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
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}

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
});