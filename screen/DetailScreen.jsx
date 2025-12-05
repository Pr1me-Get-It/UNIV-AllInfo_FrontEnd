import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Linking, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { AlramContext } from '../data/Alram';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { getToken } from '../utils/storage';

const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";

export default function DetailScreen({ route, navigation }) {
    const params = route.params || {};
    const item = params.item || null; 
    const context = useContext(AlramContext);
    const { markAsRead, toggleBookmark, bookmarkStatus, addMockEvent } = context || {};
    const itemId = item ? item.id : null;
    
    // 현재 북마크 여부 확인
    const isBookmarked = (bookmarkStatus && itemId) ? !!bookmarkStatus[itemId] : false;

    // 👇 [수정] 좋아요 숫자를 State로 관리 (초기값: 목록에서 가져온 값)
    const [likeCount, setLikeCount] = useState(item?.like || 0);

    const [deadlineInfo, setDeadlineInfo] = useState(null);
    const [loadingDeadline, setLoadingDeadline] = useState(false);

    useEffect(() => {
        if (!item || !itemId || !markAsRead) return;
        markAsRead(itemId, true);
        fetchDeadline();
    }, [item, itemId, markAsRead]);

    const fetchDeadline = async () => {
        setLoadingDeadline(true);
        try {
            const response = await api.get(`/notice/deadline/${item.id}`);
            if (response.data.isExistDeadline) {
                setDeadlineInfo(response.data.deadline);
            }
        } catch (e) {
            console.log("마감일 조회 실패 (없을 수 있음):", e);
        } finally {
            setLoadingDeadline(false);
        }
    };

    // 👇 [추가] 좋아요(북마크) 토글 핸들러
    const handleLikeToggle = async () => {
        if (toggleBookmark) {
            // 1. 서버 통신 및 상태 변경 요청
            toggleBookmark(item);

            // 2. 화면의 숫자 즉시 업데이트 (낙관적 업데이트)
            if (isBookmarked) {
                // 이미 좋아요 상태였으면 -> 취소 (-1)
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                // 아니었으면 -> 추가 (+1)
                setLikeCount(prev => prev + 1);
            }
        }
    };

    // ... (handleMarkUnread, openLink, addToCalendar 등 기존 함수 유지) ...
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

    const addToCalendar = async () => {
        if (!deadlineInfo) return;
        
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert("로그인 필요", "캘린더에 등록하려면 로그인이 필요합니다.");
                return;
            }

            if (token === DEV_TOKEN) {
                const newEvent = {
                    id: `dev-${Date.now()}`,
                    summary: `[개발] ${item.title}`,
                    location: item.source,
                    start: { 
                        date: deadlineInfo.end || deadlineInfo.start
                    }
                };
                addMockEvent(newEvent);
                Alert.alert("성공", "개발자용 캘린더에 등록되었습니다.");
                return;
            }

            const event = {
                summary: item.title,
                description: item.link + "\n\n(UNIV-AllInfo 앱에서 등록됨)",
                location: item.source,
                start: {
                    date: deadlineInfo.start || deadlineInfo.end 
                },
                end: {
                    date: deadlineInfo.end || deadlineInfo.start
                }
            };

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });

            if (response.ok) {
                Alert.alert("성공", "구글 캘린더에 일정이 등록되었습니다!");
            } else {
                Alert.alert("실패", "캘린더 등록 중 오류가 발생했습니다.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("오류", "네트워크 오류가 발생했습니다.");
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
                
                {/* 👇 [수정] 좋아요 숫자를 likeCount State로 표시 */}
                <View style={styles.metaContainer}>
                    <Text style={styles.dateText}>게시일: {item.date || '날짜 정보 없음'}</Text>
                    <Text style={styles.metaDivider}>|</Text> 
                    <View style={styles.metaLike}>
                        <Ionicons name="heart" size={14} color="#FF5252" />
                        <Text style={styles.metaLikeText}>{likeCount}</Text>
                    </View>
                </View>

                {/* ... 마감일 및 본문 ... */}
                 {loadingDeadline ? (
                    <ActivityIndicator size="small" color="rgb(219, 31, 38)" style={{marginBottom: 10}} />
                ) : deadlineInfo ? (
                    <View style={styles.deadlineCard}>
                        <View style={styles.deadlineRow}>
                            <Ionicons name="calendar" size={20} color="rgb(219, 31, 38)" />
                            <Text style={styles.deadlineTitle}>신청/마감 일정</Text>
                        </View>
                        <Text style={styles.deadlineDate}>
                            {deadlineInfo.start ? `${deadlineInfo.start} ~ ` : ''}{deadlineInfo.end}
                        </Text>
                        <TouchableOpacity style={styles.calendarBtn} onPress={addToCalendar}>
                            <Text style={styles.calendarBtnText}>📅 캘린더에 등록하기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.noDeadlineText}>- 마감일 정보가 없는 공지입니다 -</Text>
                )}


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

                    {/* 👇 [수정] 버튼 클릭 시 handleLikeToggle 호출 */}
                    <TouchableOpacity 
                        style={[styles.bookmarkBtn, isBookmarked && styles.bookmarkBtnActive]}
                        onPress={handleLikeToggle}
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
                    
                    {/* ... (읽음 표시 버튼 등) ... */}
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
    // ... (기존 스타일 유지) ...
    scrollContainer: { flexGrow: 1, backgroundColor: 'white',paddingBottom: 60 },
    wrapper: { flex: 1, paddingTop: 20, alignItems: 'center', backgroundColor: 'white' },
    badge: { backgroundColor: 'rgb(219, 31, 38)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 15 },
    badgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center', paddingHorizontal: 20 },
    dateText: { fontSize: 13, color: '#888' },
    container: { width: '100%', alignItems: 'center', paddingHorizontal: 30 },
    contentBox: { width: '100%', padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 20, alignItems: 'center' },
    contentText: { fontSize: 16, color: '#555', lineHeight: 24, textAlign: 'center', marginBottom: 20 },
    linkButton: { flexDirection: 'row', backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', gap: 8 },
    linkButtonText: { color: '#fff', fontWeight: '600' },
    bookmarkBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5
        , paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', gap: 8, marginBottom: 5 },
    bookmarkBtnActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
    btnText: { fontSize: 16, fontWeight: '600', color: '#333' },
    
    metaContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    metaDivider: { marginHorizontal: 8, color: '#ddd' },
    metaLike: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    metaLikeText: { fontSize: 12, color: '#FF5252', fontWeight: 'bold', marginLeft: 4 },

    deadlineCard: { width: '90%', backgroundColor: '#FFF5F5', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#FFE0E0', alignItems: 'center', marginBottom: 30 },
    deadlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
    deadlineTitle: { fontSize: 16, fontWeight: 'bold', color: 'rgb(219, 31, 38)' },
    deadlineDate: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 15 },
    calendarBtn: { backgroundColor: 'rgb(219, 31, 38)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    calendarBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    noDeadlineText: { color: '#aaa', fontSize: 13, marginBottom: 30, fontStyle: 'italic' }
});