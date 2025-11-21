import React, { useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlramContext } from './data/Alram'; 
import { ALRAM_DATA } from './data/mockAlrams';

export default function HomeScreen({ navigation }) {
    const { readStatus } = useContext(AlramContext) || { readStatus: {} };
    const safeStatus = readStatus || {};
    const safeData = ALRAM_DATA || []; 

    // [1] 검색어 상태 관리
    const [query, setQuery] = useState('');

    // [2] 필터링 로직 (Linear Search)
    // 검색어가 비어있으면 전체 데이터, 있으면 제목(title) 매칭
    const filteredData = safeData.filter(item => {
        const title = item.title.toLowerCase();
        const searchText = query.toLowerCase();
        return title.includes(searchText);
    });

    // 안 읽은 알림 개수는 '검색 전 전체 데이터' 기준으로 계산 (UX상 이쪽이 자연스러움)
    const unreadCount = safeData.filter(item => !safeStatus[item.id]).length;

    return (
        <View style={styles.container}>
            
            {/* 헤더 */}
            <View style={styles.headerContainer}>
                <Ionicons name='notifications' size={28} color='rgba(50, 50, 50, 0.7)' />
                <Text style={styles.headerText}>알림함</Text>
            </View>

            {/* 상단 요약 박스 */}
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>확인하지 않은 알림</Text>
                <Text style={styles.balanceText}>
                    {unreadCount} 개
                </Text>
            </View>

            {/* [3] 검색바 영역 추가 */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                <TextInput 
                    placeholder="알림 제목 검색..." 
                    placeholderTextColor="#999"
                    value={query}
                    onChangeText={setQuery}
                    style={styles.searchInput}
                />
                {/* 검색어가 있을 때만 지우기 버튼 표시 */}
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}
            </View>

            {/* 리스트 영역 */}
            <View style={styles.listContainer}>
                <FlatList
                    data={filteredData} // [4] 필터링된 데이터 연결
                    keyExtractor={(item) => String(item.id)}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    // 검색 결과가 없을 때 표시할 컴포넌트
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: '#999' }}>검색 결과가 없습니다.</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        if (!item) return null;
                        const isRead = safeStatus[item.id] === true;

                        return (
                            <TouchableOpacity
                                style={styles.itemRow}
                                onPress={() => navigation.navigate('Detail', { item })}
                            >
                                <View style={styles.iconBackground}>
                                    {/* mockAlrams에 image 경로가 없다면 오류가 날 수 있으므로 예외처리 권장 */}
                                    <Image source={item.image} style={styles.customIcon} />
                                </View>

                                <View style={styles.textWrapper}>
                                    <Text style={[
                                        styles.itemText, 
                                        isRead && styles.readText 
                                    ]}>
                                        {item.title}
                                    </Text>
                                    
                                    {isRead ? (
                                        <Text style={styles.readLabel}>읽음</Text>
                                    ) : (
                                        <Text style={styles.unreadLabel}>NEW</Text>
                                    )}
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
    
    // [새로 추가된 스타일] 검색바 스타일
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
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },

    listContainer: { flex: 1, backgroundColor: 'white', borderRadius: 20, marginHorizontal: 20, marginBottom: 100, paddingVertical: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(238, 238, 238, 1)' },
    
    iconBackground: { backgroundColor: 'transparent', width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    customIcon: { width: 40, height: 40, resizeMode: 'contain' },
    
    textWrapper: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    
    itemText: { fontSize: 16, color: '#333', fontWeight: '500' },
    readText: { color: '#aaa', textDecorationLine: 'none' },

    unreadLabel: { fontSize: 14, color: 'rgb(219, 31, 38)', fontWeight: 'bold' }, 
    readLabel: { fontSize: 14, color: '#bbb', fontWeight: 'normal' }, 
});