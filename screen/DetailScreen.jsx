import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { AlramContext } from '../data/Alram';
import { Ionicons } from '@expo/vector-icons';

export default function DetailScreen({ route, navigation }) {
    const params = route.params || {};
    const item = params.item || null; 
    const context = useContext(AlramContext);
    const { markAsRead, toggleBookmark, bookmarkStatus } = context || {};
    const itemId = item ? item.id : null;
    
    // bookmarkStatus에 해당 ID가 존재하는지(값 자체가 item 객체이므로 존재 여부만 확인하면 됨)
    const isBookmarked = (bookmarkStatus && itemId) ? !!bookmarkStatus[itemId] : false;

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

    const openLink = () => {
        if (item?.link) {
            Linking.openURL(item.link).catch(err => console.error("링크 열기 실패", err));
        }
    };

    if (!item) {
        return (
            <View style={[styles.wrapper, { justifyContent: 'center' }]}>
                <Text style={{ color: '#999' }}>데이터를 불러오는 중입니다...</Text>
            </View>
        );
    }
    
    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.wrapper}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.source || '공지'}</Text>
                </View>
                
                <Text style={styles.headerTitle}>{item.title || '제목 없음'}</Text>
                <Text style={styles.dateText}>게시일: {item.date || '날짜 정보 없음'}</Text>

                <View style={styles.container}>
                    <View style={styles.contentBox}>
                        <Text style={styles.contentText}>
                            이 공지사항의 상세 내용은 학교 홈페이지에서 확인할 수 있습니다.
                        </Text>
                        
                        {item.link && (
                            <TouchableOpacity style={styles.linkButton} onPress={openLink}>
                                <Text style={styles.linkButtonText}>공지사항 원본 보러가기</Text>
                                <Ionicons name="open-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity 
                        style={[styles.bookmarkBtn, isBookmarked && styles.bookmarkBtnActive]}
                        // [수정] ID가 아닌 item 객체 전체를 전달
                        onPress={() => toggleBookmark && toggleBookmark(item)}
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, backgroundColor: 'white' },
    wrapper: { flex: 1, paddingTop: 40, alignItems: 'center', backgroundColor: 'white' },
    badge: { backgroundColor: 'rgb(219, 31, 38)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 15 },
    badgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center', paddingHorizontal: 20 },
    dateText: { fontSize: 14, color: '#888', marginBottom: 30 },
    container: { width: '100%', alignItems: 'center', paddingHorizontal: 30 },
    contentBox: { width: '100%', padding: 20, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 20, alignItems: 'center' },
    contentText: { fontSize: 16, color: '#555', lineHeight: 24, textAlign: 'center', marginBottom: 20 },
    linkButton: { flexDirection: 'row', backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', gap: 8 },
    linkButtonText: { color: '#fff', fontWeight: '600' },
    bookmarkBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', gap: 8, marginBottom: 10 },
    bookmarkBtnActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
    btnText: { fontSize: 16, fontWeight: '600', color: '#333' }
});