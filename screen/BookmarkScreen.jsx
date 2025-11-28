// screen/BookmarkScreen.jsx
import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlramContext } from '../data/Alram';

export default function BookmarkScreen({ navigation }) {
    const context = useContext(AlramContext);
    const { bookmarkStatus } = context || { bookmarkStatus: {} };
    
    // [수정] 가짜 데이터(ALRAM_DATA)가 아닌, 저장된 북마크 상태 객체(bookmarkStatus)의 값들만 추출하여 배열로 만듦
    const bookmarkedItems = bookmarkStatus ? Object.values(bookmarkStatus) : [];

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.headerContainer}>
                <Ionicons name='star' size={28} color='#FFD700' />
                <Text style={styles.headerText}>즐겨찾기</Text>
            </View>

            {/* 리스트 */}
            <View style={styles.listContainer}>
                <FlatList
                    data={bookmarkedItems}
                    keyExtractor={(item) => String(item.id)} // ID를 문자열로 변환하여 안전하게 사용
                    contentContainerStyle={{ paddingBottom: 20 }}
                    // 북마크가 없을 때 보여줄 화면
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>저장된 알림이 없습니다.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.itemRow}
                            onPress={() => navigation.navigate('Detail', { item })}
                        >
                            <View style={styles.iconBackground}>
                                <Image source={item.image} style={styles.customIcon} />
                            </View>
                            <View style={styles.textWrapper}>
                                <Text style={styles.itemText} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Ionicons name="star" size={20} color="#FFD700" />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, backgroundColor: '#f5f5f5' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginLeft: 20 },
    headerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: '#333' },
    
    listContainer: { 
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: 20, 
        marginHorizontal: 20, 
        marginBottom: 110, 
        paddingVertical: 10,
    },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    iconBackground: { backgroundColor: 'transparent', width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    customIcon: { width: 40, height: 40, resizeMode: 'contain' },
    textWrapper: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemText: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1, marginRight: 10 },
    
    emptyBox: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 16 },
});