import React, { useState, useCallback, useMemo, useContext, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity,
  Modal, Dimensions, PanResponder, Platform, UIManager, Animated
} from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const MIN_HEIGHT = 50;
const MAX_HEIGHT = 100;
const DRAG_THRESHOLD = 30;

import { useFocusEffect } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getToken, saveToken, removeToken } from '../utils/storage';
import { AlarmContext } from '../data/Alarm';
import { useAuth } from '../context/AuthContext';
import LoginPlaceholder from '../components/ui/LoginPlaceholder'
import academicSchedule from '../constants/academic_schedule.json';
import { useQuery } from '@tanstack/react-query';

// 한국어 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

const TODAY_STR = new Date().toISOString().split('T')[0];
const screenWidth = Dimensions.get('window').width;
const dayWidth = (screenWidth - 32) / 7;

// API 호출 함수 분리
const fetchGoogleEvents = async () => {
  try {
    const storedToken = await getToken();
    if (!storedToken) return [];

    let accessToken = storedToken;
    try {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) accessToken = tokens.accessToken;
    } catch (e) { }

    const timeMin = new Date('2025-01-01T00:00:00Z').toISOString();
    const timeMax = new Date('2025-12-31T23:59:59Z').toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (response.ok) {
      const data = await response.json();
      return data.items || [];
    }
  } catch (e) {
    console.error("Google Calendar API Error:", e);
  }
  return [];
};

export default function CalendarScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [filterMode, setFilterMode] = useState('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const animatedHeight = useRef(new Animated.Value(MIN_HEIGHT)).current;
  const textOpacity = animatedHeight.interpolate({
    inputRange: [MIN_HEIGHT, MIN_HEIGHT + 20, MAX_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp'
  });

  const { userEmail, isAuthenticated } = useAuth();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // 부모(FlatList)가 터치 뺏어가는 것을 방지

      onPanResponderMove: (_, gestureState) => {
        const baseHeight = isExpanded ? MAX_HEIGHT : MIN_HEIGHT;
        // 캘린더가 보통 5~6주이므로, 단일 셀 높이 변화는 전체 드래그의 1/n이어야 핸들이 손가락을 따라옴
        const APPROX_ROWS = 10;
        let newHeight = baseHeight + (gestureState.dy / APPROX_ROWS);

        // 범위 제한
        if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
        if (newHeight > MAX_HEIGHT) newHeight = MAX_HEIGHT;

        animatedHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        // 드래그가 끝났을 때 결정

        let targetHeight = MIN_HEIGHT;
        let targetState = false;

        // 임계값도 스케일링을 고려하여 조정 (더 많이 당겨야 인식되도록 할지, 아니면 그대로 둘지)
        // 기존 30은 꽤 작은 값이므로 유지하되, 판단 기준은 gestureState.dy (손가락 이동 거리) 그대로 사용
        if (isExpanded) {
          if (gestureState.dy < -DRAG_THRESHOLD) {
            targetHeight = MIN_HEIGHT;
            targetState = false;
          } else {
            targetHeight = MAX_HEIGHT; // 복귀
            targetState = true;
          }
        } else {
          if (gestureState.dy > DRAG_THRESHOLD) {
            targetHeight = MAX_HEIGHT;
            targetState = true;
          } else {
            targetHeight = MIN_HEIGHT; // 복귀
            targetState = false;
          }
        }

        setIsExpanded(targetState);
        Animated.spring(animatedHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          friction: 12,
          tension: 50
        }).start();
      },
    })
  ).current;

  const { data: googleEvents = [], isLoading, refetch } = useQuery({
    queryKey: ['calendarEvents', userEmail],
    queryFn: fetchGoogleEvents,
    enabled: !!userEmail && isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  useFocusEffect(
    useCallback(() => {
      if (userEmail && isAuthenticated) refetch();
    }, [userEmail, isAuthenticated, refetch])
  );

  const events = useMemo(() => {
    return [...googleEvents, ...academicSchedule];
  }, [googleEvents]);

  const getDatesInRange = (startDate: string, endDate: string) => {
    const dates = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const visibleEvents = useMemo(() => {
    return events.filter((event: any) => {
      if (filterMode === 'all') return true;
      const type = event.hasOwnProperty('type') ? event.type : -1;
      return filterMode === 'undergraduate' ? type === 0 : type === 1;
    });
  }, [events, filterMode]);

  const daySelectedEvents = useMemo(() => {
    return visibleEvents.filter((e: any) => {
      const s = e.start.date || e.start.dateTime?.split('T')[0];
      const end = e.end?.date || e.end?.dateTime?.split('T')[0] || s;
      return selectedDate >= s && selectedDate <= end;
    });
  }, [visibleEvents, selectedDate]);

  const eventsByDate = useMemo(() => {
    const map: any = {};
    const sorted = [...visibleEvents].sort((a: any, b: any) => a.id.localeCompare(b.id));

    sorted.forEach((event: any) => {
      const start = event.start.date || event.start.dateTime?.split('T')[0];
      const end = event.end?.date || event.end?.dateTime?.split('T')[0] || start;
      if (start) {
        const range = getDatesInRange(start, end);
        const totalDays = range.length;
        range.forEach((date, index) => {
          if (!map[date]) map[date] = [];
          const type = event.hasOwnProperty('type') ? event.type : -1;
          const summary = event.summary || '일정';
          map[date].push({
            id: event.id,
            summary: summary,
            color: type === 1 ? '#E0F2FE' : (type === 0 ? '#FEE2E2' : '#E3F2FD'),
            textColor: type === 1 ? '#0369a1' : (type === 0 ? '#b91c1c' : '#0284c7'),
            isStart: index === 0,
            isEnd: index === totalDays - 1,
            dayIndex: index,
            totalDays: totalDays
          });
        });
      }
    });
    return map;
  }, [visibleEvents]);

  const renderDay = useCallback(({ date, state }: any) => {
    const dateStr = date.dateString;
    const dayEvents = eventsByDate[dateStr] || [];
    const isSelected = dateStr === selectedDate;
    const isToday = state === 'today';
    const maxEvents = 4;

    return (
      <AnimatedTouchableOpacity
        style={[styles.dayBox, { height: animatedHeight }, isSelected && styles.selectedDayBox]}
        onPress={() => setSelectedDate(dateStr)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>
          {date.day}
        </Text>
        <View style={styles.eventContainer}>
          {dayEvents.slice(0, maxEvents).map((ev: any, i: number) => {
            let shouldShowTitle = false;
            if (ev.totalDays <= 2) {
              shouldShowTitle = ev.isStart;
            } else {
              const middleIndex = Math.floor((ev.totalDays - 1) / 2);
              shouldShowTitle = ev.dayIndex === middleIndex;
            }

            return (
              <View
                key={`${ev.id}-${i}`}
                style={[
                  styles.block,
                  {
                    backgroundColor: ev.color,
                    height: 14,
                    marginBottom: 1,
                    width: '110%',
                    marginLeft: '-10%',
                    borderTopLeftRadius: ev.isStart ? 3 : 0,
                    borderBottomLeftRadius: ev.isStart ? 3 : 0,
                    borderTopRightRadius: ev.isEnd ? 3 : 0,
                    borderBottomRightRadius: ev.isEnd ? 3 : 0,
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                    zIndex: shouldShowTitle ? 10 : 0
                  }
                ]}
              >
                {shouldShowTitle && (
                  <Animated.Text
                    style={[
                      styles.eventTitle,
                      {
                        color: ev.textColor,
                        opacity: textOpacity,
                        textAlign: ev.totalDays > 2 ? 'center' : 'left'
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {ev.summary || '일정'}
                  </Animated.Text>
                )}
              </View>
            );
          })}
          {dayEvents.length > maxEvents && (
            <Text style={{ fontSize: 8, color: '#999', marginTop: 1 }}>+{dayEvents.length - maxEvents}</Text>
          )}
        </View>
      </AnimatedTouchableOpacity>
    );
  }, [eventsByDate, selectedDate, animatedHeight, textOpacity]);

  const formatTime = (dateTime: string) => {
    if (!dateTime) return '종일';
    return new Date(dateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={28} color="rgb(219, 31, 38)" />
            <Text style={styles.headerTitle}>캘린더</Text>
          </View>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <Calendar
          current={selectedDate}
          dayComponent={renderDay}
          monthFormat={'yyyy년 M월'}
          renderArrow={(direction: any) => (
            <Ionicons name={direction === 'left' ? "chevron-back" : "chevron-forward"} size={28} color="rgb(219, 31, 38)" />
          )}
          theme={{
            todayTextColor: 'rgb(219, 31, 38)',
            'stylesheet.calendar.main': {
              week: { marginTop: 2, marginBottom: 2, flexDirection: 'row', justifyContent: 'space-around' }
            }
          } as any}
          disableMonthChange={isExpanded}
          enableSwipeMonths={!isExpanded}
          hideExtraDays={true}
        />
        <View style={styles.dragHandleContainer} {...panResponder.panHandlers} onStartShouldSetResponderCapture={() => true}>
          <View style={styles.dragHandle} />
          <Text style={styles.dragText}>
            {isExpanded ? "위로 올려서 접기" : "아래로 당겨서 펼치기"}
          </Text>
        </View>
      </View>

      <View style={styles.listHeaderContainer}>
        <Text style={styles.listHeader}>{selectedDate} 일정</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isLoading && <ActivityIndicator size="small" color="rgb(219, 31, 38)" style={{ marginRight: 8 }} />}
          <Text style={styles.eventCountText}>{daySelectedEvents.length}개</Text>
        </View>
      </View>
    </>
  );

  if (!isAuthenticated) return <LoginPlaceholder />;

  return (
    <View style={styles.container}>
      <FlatList
        data={daySelectedEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.typeIndicator, { backgroundColor: item.type === 1 ? '#3B82F6' : 'rgb(219, 31, 38)' }]} />
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.summary}</Text>
              <Text style={styles.timeLabel}>
                {item.start.date ? '하루 종일' : formatTime(item.start.dateTime)}
              </Text>
            </View>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>일정이 없습니다.</Text>}
      />

      <Modal visible={isFilterModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>일정 필터</Text>
            {['all', 'undergraduate', 'graduate'].map(m => (
              <TouchableOpacity key={m} style={styles.filterOption} onPress={() => { setFilterMode(m); setFilterModalVisible(false); }}>
                <Text style={filterMode === m ? styles.activeFilterText : styles.filterText}>
                  {m === 'all' ? '전체' : m === 'undergraduate' ? '학부' : '대학원'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginLeft: 10 },

  dayBox: { width: dayWidth, alignItems: 'center', paddingTop: 5, overflow: 'hidden' },
  selectedDayBox: { backgroundColor: 'rgba(219, 31, 38, 0.05)', borderRadius: 8 },
  dayText: { fontSize: 14, color: '#333', marginBottom: 2 },
  todayText: { color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
  selectedDayText: { fontWeight: 'bold' },
  eventContainer: { width: '100%', marginTop: 2, paddingHorizontal: 1 },
  block: { marginBottom: 1 },
  eventTitle: { fontSize: 10, fontWeight: 'bold', marginLeft: 2 },

  dragHandleContainer: { alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  dragHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, marginBottom: 4 },
  dragText: { fontSize: 10, color: '#aaa' },

  listHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  eventCountText: { fontSize: 14, color: '#888', fontWeight: '600' },
  listContent: { paddingBottom: 120 },

  card: { backgroundColor: '#fff', marginHorizontal: 20, padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  typeIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: 10 },
  cardContent: { flex: 1 },
  title: { fontSize: 16, color: '#333', fontWeight: '500' },
  timeLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  filterOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterText: { fontSize: 16, color: '#666' },
  activeFilterText: { fontSize: 16, color: 'rgb(219, 31, 38)', fontWeight: 'bold' }
});