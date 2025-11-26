import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlramContext } from '../data/Alram'; 
import { api } from '../api/client'; 
import { ALRAM_DATA } from '../data/mockAlrams'; 

const DEFAULT_IMAGE = require('../assets/knu.png');

export default function HomeScreen({ navigation }) {
    const { readStatus } = useContext(AlramContext) || { readStatus: {} };
    const safeStatus = readStatus || {};

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState(''); 
    const [page, setPage] = useState(1);    
    const [hasMore, setHasMore] = useState(true); 
    const [refreshing, setRefreshing] = useState(false); 

    const fetchNotices = useCallback(async (pageNum, keyword = '', shouldRefresh = false) => {
        if (!shouldRefresh && loading) return; 
        
        setLoading(true);
        try {
            // 백엔드 API 호출
            const params = { p: pageNum };
            if (keyword) params.keyword = keyword;

            const response = await api.get('/notice', { params });
            const { notices, totalPages } = response.data;
            const safeNotices = Array.isArray(notices) ? notices : [];
            
            const noticesWithImage = safeNotices.map(item => ({
                ...item,
                image: DEFAULT_IMAGE, 
            }));

            if (shouldRefresh) {
                setData(noticesWithImage);
            } else {
                setData(prev => [...prev, ...noticesWithImage]);
            }

            setHasMore(pageNum < totalPages);

        } catch (error) {
            console.error('공지사항 조회 실패 (목업 데이터 사용):', error);
            // API 실패 시 목업 데이터 10배 뻥튀기해서 보여주기
            if (pageNum === 1) { 
                const mockList = Array.from({ length: 1 }).flatMap((_, i) => 
                    ALRAM_DATA.map(item => ({
                        ...item,
                        id: `mock-${i}-${item.id}`, // 고유 키를 위해 ID 변형
                        title: `[Test] ${item.title}`,
                        source: '공지사항',         // 화면에 표시될 source 가짜 데이터
                        date: '2024-01-01',         // 화면에 표시될 날짜 가짜 데이터
                        image: item.image || DEFAULT_IMAGE
                    }))
                );
                const filteredMock = keyword 
                    ? mockList.filter(m => m.title.includes(keyword)) 
                    : mockList;

                setData(filteredMock);
                setHasMore(false); 
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

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

            <View style={styles.listContainer}>
                <FlatList
                    data={data}
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