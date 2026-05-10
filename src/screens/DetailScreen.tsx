import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AppText from '../components/AppText';
import CustomAlert from '../components/ui/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useDetailLogic, stripHtml, formatDate } from '../hooks/screens/useDetailLogic';

type DetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

interface Props {
  navigation: DetailScreenNavigationProp;
  route: DetailScreenRouteProp;
}

export default function DetailScreen({ route, navigation }: Props) {
  const {
    item,
    displaySource,
    isBookmarked,
    likeCount,
    deadlineInfo,
    loadingDeadline,
    alertVisible,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    alertButtons,
    closeAlert,
    handleLikeToggle,
    handleMarkUnread,
    openLink,
    addToCalendar,
  } = useDetailLogic(route, navigation);

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <AppText style={styles.guideText}>데이터를 불러오는 중입니다...</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* 1. Header Area */}
      <View style={styles.headerSection}>
        <View style={styles.sourceBadge}>
          <AppText style={styles.sourceText}>{displaySource}</AppText>
        </View>

        <AppText style={styles.title}>{stripHtml(item?.title) || '제목 없음'}</AppText>

        <View style={styles.metaRow}>
          <AppText style={styles.dateText}>{item.date || '날짜 미상'}</AppText>
          <View style={styles.metaDivider} />
          <View style={styles.likeBadge}>
            <Ionicons name="heart" size={12} color="#fff" />
            <AppText style={styles.likeText}>{likeCount}</AppText>
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
                <AppText style={styles.deadlineLabel}>마감 일정</AppText>
              </View>
              <TouchableOpacity onPress={addToCalendar} style={styles.calendarIconBtn}>
                <Ionicons name="calendar-outline" size={18} color="#DB1F26" />
              </TouchableOpacity>

            </View>
            <AppText style={styles.deadlineDate}>
              {deadlineInfo.kickoff ? `${formatDate(deadlineInfo.kickoff)} ~ ` : ''}
              {formatDate(deadlineInfo.deadline) || '상시 모집'}
            </AppText>
            <AppText style={styles.warningText}>
              * 실제와 다를 수 있습니다! 꼭 확인해주세요!
            </AppText>
          </View>
        ) : null}

        {/* Description Text */}
        <AppText style={styles.guideText}>
          상세 내용은 아래 버튼을 눌러 학교 홈페이지에서 확인하세요.
        </AppText>


        {/* 3. Action Buttons */}
        <View style={styles.actionGroup}>
          {/* Link Button */}
          {item.link && (
            <TouchableOpacity style={styles.primaryLinkBtn} onPress={openLink} activeOpacity={0.8}>
              <AppText style={styles.primaryLinkText}>공지사항 원본 보기</AppText>
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
            <AppText style={[styles.bookmarkText, isBookmarked && styles.bookmarkTextActive]}>
              {isBookmarked ? '저장됨' : '북마크 저장'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Mark Unread (Subtle) */}
        <TouchableOpacity onPress={handleMarkUnread} style={styles.textBtn}>
          <AppText style={styles.textBtnLabel}>다시 '안 읽음'으로 표시하기</AppText>
        </TouchableOpacity>
      </View>

      {/* 커스텀 알림 */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={closeAlert}
        onConfirm={alertOnConfirm}
        buttons={alertButtons}
      />
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
    padding: 30,
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
  warningText: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
});
