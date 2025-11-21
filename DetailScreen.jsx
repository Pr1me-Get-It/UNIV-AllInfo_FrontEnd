// screens/DetailScreen.jsx
import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Button,TouchableOpacity } from 'react-native';
import { AlramContext } from './data/Alram';
import { Ionicons } from '@expo/vector-icons';

export default function DetailScreen({ route, navigation }) {
    const params = route.params || {};
    const item = params.item || null; 
    const context = useContext(AlramContext);
    const { markAsRead, toggleBookmark, bookmarkStatus } = context || {};
    const itemId = item ? item.id : null;
    const isBookmarked = (bookmarkStatus && itemId) ? bookmarkStatus[itemId] : false;

    useEffect(() => {
    if (!item || !itemId || !markAsRead) return;
    markAsRead(itemId, true);
}, [item, itemId, markAsRead]);

    const handleMarkUnread = () => {
        if (markAsRead) {
            markAsRead(item.id, false); 
            navigation.goBack();
        }
    };

    if (!item) {
    return (
        <View style={[styles.wrapper, { justifyContent: 'center' }]}>
            <Text style={{ color: '#999', marginBottom: 10 }}>
                데이터를 불러오는 중입니다...
            </Text>
        </View>
    );
}
    
    return (
        <View style={styles.wrapper}>
            <Text style={styles.headerTitle}>
                {item.title || '제목 없음'}
            </Text>

            <View style={styles.container}>
                {/* 내용 표시 영역 */}
                <View style={styles.contentBox}>
                    <Text style={styles.contentText}>
                        백앤드가 추가 해주겠지
                    </Text>
                </View>

                <TouchableOpacity 
                    style={[styles.bookmarkBtn, isBookmarked && styles.bookmarkBtnActive]}
                    onPress={() => toggleBookmark && toggleBookmark(item.id)}
                >
                    <Ionicons 
                        name={isBookmarked ? "star" : "star-outline"} 
                        size={24} 
                        color={isBookmarked ? "#fff" : "#333"} 
                    />
                    <Text style={[styles.btnText, isBookmarked && { color: '#fff' }]}>
                        {isBookmarked ? "북마크 해제" : "북마크에 추가"}
                    </Text>
                </TouchableOpacity>

                <View style={{ marginTop: 20 }}>
                     <Text style={{ color: 'green', marginBottom: 20, fontWeight: 'bold' }}>
                        ✔ 읽음 처리되었습니다.
                    </Text>
                </View>

                <Button title="다시 '안 읽음'으로 표시" onPress={handleMarkUnread} color="#888" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, paddingTop: 80, alignItems: 'center', backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#333' },
    container: { width: '100%', alignItems: 'center', paddingHorizontal: 30 },
    
    contentBox: {
        width: '100%',
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 20,
    },
    contentText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        textAlign: 'center',
    },
    bookmarkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        gap: 8,
        marginBottom: 10,
    },
    bookmarkBtnActive: {
        backgroundColor: '#FFD700', 
        borderColor: '#FFD700',
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    }
});