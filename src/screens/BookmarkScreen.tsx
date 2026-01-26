// screen/BookmarkScreen.jsx
import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlarmContext } from '../data/Alarm';
import { useAuth } from '../context/AuthContext';
import LoginPlaceholder from '../components/ui/LoginPlaceholder'

// 타입 정의 추가
interface BookmarkItem {
    id: string | number;
    title: string;
    image: any;
    [key: string]: any; // 다른 속성 허용
}

export default function BookmarkScreen({ navigation }: any) {
    // 1. Context에서 필요한 데이터와 인증 상태를 가져옵니다.
    const context = useContext(AlarmContext);
    const { bookmarkStatus } = context || { bookmarkStatus: {} };

    // AuthContext가 제공하는 isAuthenticated를 사용하여 로그인 여부를 판단합니다.
    const { userEmail, isAuthenticated } = useAuth();

    const bookmarkedItems = bookmarkStatus ? Object.values(bookmarkStatus) as BookmarkItem[] : [];

    // 2. 비로그인 상태일 때의 처리
    if (!isAuthenticated) {
        return <LoginPlaceholder />;
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
        backgroundColor: '#f5f5f5'
    },
    msg: { fontSize: 16, color: 'rgba(136, 136, 136, 1)', marginBottom: 15 },
    btn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: '600' },
});