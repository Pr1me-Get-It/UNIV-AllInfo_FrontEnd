import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  Linking,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AlarmContext } from '../data/Alarm';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { getToken } from '../utils/storage';
import SOURCE_LABELS from '../constants/labeltag.json';

const DEV_TOKEN = 'DEV_MODE_ACCESS_TOKEN';
const stripHtml = text => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '') // <태그> 제거
    .replace(/&nbsp;/g, ' ') // 공백 엔티티 변환
    .replace(/&amp;/g, '&') // & 엔티티 변환
    .replace(/&lt;/g, '<') // < 엔티티 변환
    .replace(/&gt;/g, '>'); // > 엔티티 변환
};

export default function DetailScreen({ route, navigation }) {
  const params = route.params || {};
  const item = params.item || null;
  const context = useContext(AlarmContext);
  const { markAsRead, toggleBookmark, bookmarkStatus, addMockEvent } = context || {};
  // [수정] API 응답의 notice_id를 우선 사용
  const itemId = item ? item.notice_id || item.id : null;
  const sourcePrefix = item?.source ? item.source.split('/')[0] : '';
  const displaySource = SOURCE_LABELS[sourcePrefix] || item?.source || '출처 없음';

  // 현재 북마크 여부 확인
  const isBookmarked = bookmarkStatus && itemId ? !!bookmarkStatus[itemId] : false;

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
    if (!itemId) return; // ID가 없으면 중단
    setLoadingDeadline(true);
    try {
      // [수정] item.id 대신 itemId 사용
      const response = await api.get(`/notice/${itemId}/deadline`);
      console.log(`[Deadline Info] ID: ${itemId}`, response.data); // 로그 추가

      // [수정] 실제 API 응답 구조에 맞춰 파싱 (response.data 자체가 객체임)
      // 예: {"deadline": "...", "kickoff": "...", ...}
      if (response.data && (response.data.deadline || response.data.kickoff)) {
        setDeadlineInfo(response.data);
      } else {
        setDeadlineInfo(null);
      }
    } catch (e) {
      console.log('마감일 조회 실패 (없을 수 있음):', e);
      setDeadlineInfo(null);
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
      Linking.openURL(item.link).catch(err => console.error('링크 열기 실패', err));
    }
  };

  const addToCalendar = async () => {
    if (!deadlineInfo) return;

    try {
      const token = await getToken();
      console.log('[Calendar Debug] Token:', token); // 토큰 확인

      if (!token) {
        Alert.alert('로그인 필요', '캘린더에 등록하려면 로그인이 필요합니다.');
        return;
      }

      if (token === DEV_TOKEN) {
        const newEvent = {
          id: `dev-${Date.now()}`,
          summary: `[개발] ${item.title}`,
          location: item.source,
          start: {
            date: deadlineInfo.end || deadlineInfo.start,
          },
        };
        addMockEvent(newEvent);
        Alert.alert('성공', '개발자용 캘린더에 등록되었습니다.');
        return;
      }

      // [수정] deadlineInfo의 실제 프로퍼티(kickoff, deadline) 사용 및 날짜 포맷팅
      const startDate = (deadlineInfo.kickoff || deadlineInfo.deadline)?.split('T')[0];
      const endDate = (deadlineInfo.deadline || deadlineInfo.kickoff)?.split('T')[0];

      const event = {
        summary: item.title,
        description: `참조링크 : ${item.link}`,
        start: {
          date: startDate,
        },
        end: {
          date: endDate,
        },
      };
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        },
      );

      if (response.ok) {
        Alert.alert('성공', '구글 캘린더에 일정이 등록되었습니다!');
      } else {
        Alert.alert('실패', '캘린더 등록 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.error('[Calendar Debug] Error:', e);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.guideText}>데이터를 불러오는 중입니다...</Text>
      </View>
    );
  }
  const formatDate = dateStr => {
    if (!dateStr) return null;
    return dateStr.split('T')[0];
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* 1. Header Area */}
      <View style={styles.headerSection}>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{displaySource}</Text>
        </View>

        <Text style={styles.title}>{stripHtml(item?.title) || '제목 없음'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.dateText}>{item.date || '날짜 미상'}</Text>
          <View style={styles.metaDivider} />
          <View style={styles.likeBadge}>
            <Ionicons name="heart" size={12} color="#fff" />
            <Text style={styles.likeText}>{likeCount}</Text>
          </View>
        </View>
      </View>

      {/* 2. Content & Deadline Area */}
      <View style={styles.bodySection}>
        {/* Deadline Card */}
        {loadingDeadline ? (
          <ActivityIndicator size="small" color="#DB1F26" style={{ marginVertical: 20 }} />
        ) : deadlineInfo && (deadlineInfo.kickoff || deadlineInfo.deadline) ? (
          <View style={styles.deadlineCard}>
            <View style={styles.deadlineHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={18} color="#DB1F26" />
                <Text style={styles.deadlineLabel}>마감 일정</Text>
              </View>
              <TouchableOpacity onPress={addToCalendar} style={styles.calendarIconBtn}>
                <Ionicons name="calendar-outline" size={18} color="#DB1F26" />
              </TouchableOpacity>
            </View>
            <Text style={styles.deadlineDate}>
              {deadlineInfo.kickoff ? `${formatDate(deadlineInfo.kickoff)} ~ ` : ''}
              {formatDate(deadlineInfo.deadline) || '상시 모집'}
            </Text>
          </View>
        ) : null}

        {/* Description Text */}
        <Text style={styles.guideText}>
          상세 내용은 아래 버튼을 눌러 학교 홈페이지에서 확인하세요.
        </Text>

        {/* 3. Action Buttons */}
        <View style={styles.actionGroup}>
          {/* Link Button */}
          {item.link && (
            <TouchableOpacity style={styles.primaryLinkBtn} onPress={openLink} activeOpacity={0.8}>
              <Text style={styles.primaryLinkText}>공지사항 원본 보기</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Bookmark Button */}
          <TouchableOpacity
            style={[styles.bookmarkBtn, isBookmarked && styles.bookmarkBtnActive]}
            onPress={handleLikeToggle}
            activeOpacity={0.8}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? '#fff' : '#333'}
            />
            <Text style={[styles.bookmarkText, isBookmarked && styles.bookmarkTextActive]}>
              {isBookmarked ? '저장됨' : '북마크 저장'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mark Unread (Subtle) */}
        <TouchableOpacity onPress={handleMarkUnread} style={styles.textBtn}>
          <Text style={styles.textBtnLabel}>다시 '안 읽음'으로 표시하기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  // Header Section
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgb(219, 31, 38)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },
  sourceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 32,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  likeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  likeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Body Section
  bodySection: {
    padding: 24,
  },
  // Deadline Card
  deadlineCard: {
    backgroundColor: '#FFF5F5', // 연한 붉은 배경
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  deadlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deadlineLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DB1F26',
  },
  deadlineDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarIconBtn: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },

  // Content
  guideText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Actions
  actionGroup: {
    gap: 12,
    marginBottom: 32,
  },
  primaryLinkBtn: {
    backgroundColor: '#111827', // 검정 배경
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bookmarkBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkBtnActive: {
    backgroundColor: 'rgb(219, 31, 38)', // 활성 시 빨간 배경
    borderColor: 'rgb(219, 31, 38)',
  },
  bookmarkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  bookmarkTextActive: {
    color: '#fff',
  },

  // Subtle Button
  textBtn: {
    alignSelf: 'center',
    padding: 10,
  },
  textBtnLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
