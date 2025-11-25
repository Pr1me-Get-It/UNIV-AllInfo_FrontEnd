import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlramContext } from '../data/Alram'; 
import { api } from '../api/client'; // API 클라이언트 import

// 기본 이미지 (출처별로 다르게 설정 가능)
const DEFAULT_IMAGE = require('../assets/knu.png');

export default function HomeScreen({ navigation }) {
    const { readStatus } = useContext(AlramContext) || { readStatus: {} };
    const safeStatus = readStatus || {};

    // 상태 관리
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState(''); // 검색어
    const [page, setPage] = useState(1);    // 현재 페이지
    const [hasMore, setHasMore] = useState(true); // 다음 페이지 존재 여부
    const [refreshing, setRefreshing] = useState(false); // 당겨서 새로고침

    // 데이터 가져오기 함수
    const fetchNotices = useCallback(async (pageNum, keyword = '', shouldRefresh = false) => {
        if (!shouldRefresh && loading) return; // 로딩 중 중복 방지
        
        setLoading(true);
        try {
            // 백엔드 API 호출: /notice?p=1&keyword=...
            const params = { p: pageNum };
            if (keyword) params.keyword = keyword;

            const response = await api.get('/notice', { params });
            const { notices, totalPages } = response.data;
            const safeNotices = Array.isArray(notices) ? notices : [];
            // 데이터 가공 (이미지 추가)
            const noticesWithImage = safeNotices.map(item => ({
                ...item,
                image: DEFAULT_IMAGE, 
            }));

            if (shouldRefresh) {
                setData(noticesWithImage);
            } else {
                setData(prev => [...prev, ...noticesWithImage]);
            }

            // 다음 페이지가 있는지 확인
            setHasMore(pageNum < totalPages);
        } catch (error) {
            console.error('공지사항 조회 실패:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // [1] 초기 로딩 및 검색어 변경 시 호출 (디바운스 적용 권장이나 간단히 처리)
    useEffect(() => {
        // 검색어가 바뀌면 1페이지부터 다시 검색
        setPage(1);
        fetchNotices(1, query, true);
    }, [query]);

    // [2] 다음 페이지 로딩 (무한 스크롤)
    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotices(nextPage, query, false);
        }
    };

    // [3] 당겨서 새로고침
    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchNotices(1, query, true);
    };

    // 안 읽은 알림 개수 계산 (현재 불러온 데이터 기준)
    const unreadCount = data.filter(item => !safeStatus[item.id]).length;

    return (
        <View style={styles.container}>
            
            {/* 헤더 */}
            <View style={styles.headerContainer}>
                <Ionicons name='notifications' size={28} color='rgba(50, 50, 50, 0.7)' />
                <Text style={styles.headerText}>알림함</Text>
            </View>

            {/* 상단 요약 박스 */}
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>확인하지 않은 알림 (현재 목록 기준)</Text>
                <Text style={styles.balanceText}>
                    {unreadCount} 개
                </Text>
            </View>

            {/* 검색바 영역 */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                <TextInput 
                    placeholder="알림 제목 검색..." 
                    placeholderTextColor="#999"
                    value={query}
                    onChangeText={setQuery} // 텍스트 변경 시 자동으로 검색 API 호출 (useEffect)
                    style={styles.searchInput}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}
            </View>

            {/* 리스트 영역 */}
            <View style={styles.listContainer}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => String(item.id)} // id를 문자열로 변환하여 키로 사용
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    onEndReached={loadMore} // 스크롤 끝에 닿으면 다음 페이지 로딩
                    onEndReachedThreshold={0.5}
                    
                    // 로딩 및 빈 상태 표시
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
                                    {/* 백엔드 데이터: source 표시 (예: ELE, CSE) */}
                                    <Text style={styles.sourceText}>{item.source}</Text> 
                                    
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

    balanceContainer: { backgroundColor: 'rgb(219, 31, 38)', marginHorizontal: 20, marginBottom: 15, padding: 20, borderRadius: 15, alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
    balanceText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchInput: { flex: 1, fontSize: 16, color: '#333' },

    listContainer: { flex: 1, backgroundColor: 'white', borderRadius: 20, marginHorizontal: 20, marginBottom: 100, paddingVertical: 10 },
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
});