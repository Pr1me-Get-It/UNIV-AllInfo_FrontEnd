// screen/BookmarkScreen.jsx
import React, { useContext, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // 👈 추가
import { Ionicons } from '@expo/vector-icons';
import { AlramContext } from '../data/Alram';
import { getToken } from '../utils/storage'; // 👈 추가

export default function BookmarkScreen({ navigation }) {
    const context = useContext(AlramContext);
    const { bookmarkStatus } = context || { bookmarkStatus: {} };
    
    // 👇 [추가] 로그인 상태 관리
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    // 👇 [추가] 화면이 포커스될 때마다 로그인 여부 체크
    useFocusEffect(
        useCallback(() => {
            checkLogin();
        }, [])
    );

    const checkLogin = async () => {
        setLoading(true);
        const token = await getToken();
        setIsLoggedIn(!!token); // 토큰이 있으면 true, 없으면 false
        setLoading(false);
    };

    const bookmarkedItems = bookmarkStatus ? Object.values(bookmarkStatus) : [];

    // 👇 [추가] 로딩 중 표시
    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="rgb(219, 31, 38)" />
            </View>
        );
    }

    // 👇 [추가] 비로그인 시 안내 화면
    if (!isLoggedIn) {
        return (
            <View style={styles.loginContainer}> 
                <Ionicons name="lock-closed-outline" size={60} color="#ccc" style={{ marginBottom: 20 }} />
                <Text style={styles.msg}>로그인이 필요한 기능입니다.</Text>
                <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('All')}>
                    <Text style={styles.btnText}>로그인 하러 가기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Ionicons name='star' size={28} color='#FFD700' />
                <Text style={styles.headerText}>즐겨찾기</Text>
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    data={bookmarkedItems}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ paddingBottom: 20 }}
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
    // 👇 [추가] 중앙 정렬 스타일
    center: { justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }, 
    
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
    
    loginContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f5f5f5' // 배경색만 유지
    },
    // 👇 [추가] 로그인 안내 스타일 (CalendarScreen과 동일)
    msg: { fontSize: 16, color: 'rgba(136, 136, 136, 1)', marginBottom: 15 },
    btn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: '600' },
});