import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import AppText from '../components/AppText';

const MIN_HEIGHT = 50;
const MAX_HEIGHT = 80;

import { useFocusEffect } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LoginPlaceholder from '../components/ui/LoginPlaceholder';
import academicSchedule from '../constants/academic_schedule.json';
import { moderateScale } from '../utils/responsive';
import { useQuery } from '@tanstack/react-query';
import { fetchGoogleEvents } from '../api/calendarService';
import CalendarDay from '../components/CalendarDay';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { CalendarHeightProvider } from '../context/CalendarHeightContext';
import { processCalendarEvents, LayedOutEvent } from '../utils/calendarLayout';
import { getData, saveData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 한국어 설정
LocaleConfig.locales['kr'] = {
  monthNames: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  monthNamesShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'kr';

const TODAY_STR = new Date().toISOString().split('T')[0];
const screenWidth = Dimensions.get('window').width;
const dayWidth = (screenWidth - 32) / 7;

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTab'>;

interface Props {
  navigation: CalendarScreenNavigationProp;
}

export default function CalendarScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [filterMode, setFilterMode] = useState('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reanimated Shared Value
  const itemHeight = useSharedValue(MIN_HEIGHT);
  const startHeight = useSharedValue(MIN_HEIGHT);

  const { userEmail, isAuthenticated } = useAuth();

  // Gesture Handler
  const panGesture = Gesture.Pan()
    // 캘린더가 접혀있을 때는 아래로만(10) 제스처 활성화하여, 위로 스와이프 시 아래의 ScrollView가 스크롤되도록 함
    // 캘린더가 펼쳐져 있을 때는 위로도(-10) 제스처를 활성화하여 캘린더를 접을 수 있게 함
    .activeOffsetY(isExpanded ? [-10, 10] : 10)
    .onStart(() => {
      startHeight.value = itemHeight.value;
    })
    .onUpdate((e) => {
      const sensitivity = 0.4; // 적당한 드래그 감도
      let newHeight = startHeight.value + e.translationY * sensitivity;
      if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
      if (newHeight > MAX_HEIGHT) newHeight = MAX_HEIGHT;
      itemHeight.value = newHeight;
    })
    .onEnd(() => {
      // Snap logic
      if (itemHeight.value > (MIN_HEIGHT + MAX_HEIGHT) / 2) {
        itemHeight.value = withSpring(MAX_HEIGHT, { damping: 70 });
        runOnJS(setIsExpanded)(true);
      } else {
        itemHeight.value = withSpring(MIN_HEIGHT, { damping: 70 });
        runOnJS(setIsExpanded)(false);
      }
    });

  const {
    data: googleEvents = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['calendarEvents', userEmail],
    queryFn: fetchGoogleEvents,
    enabled: !!userEmail && isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  useFocusEffect(
    useCallback(() => {
      if (userEmail && isAuthenticated) refetch();
    }, [userEmail, isAuthenticated, refetch]),
  );

  const events = useMemo(() => {
    return [...googleEvents, ...academicSchedule] as any[];
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

  // 1. Process events for Calendar Layout (Month View)
  const [currentMonth, setCurrentMonth] = useState(TODAY_STR);

  const processedEvents = useMemo(() => {
    // We pass 'visibleEvents' which are already filtered by type (Undergrad/Grad)
    // Use currentMonth substring(0, 7) instead of selectedDate
    return processCalendarEvents(visibleEvents, currentMonth.substring(0, 7));
  }, [visibleEvents, currentMonth]); // Re-calc only when events change or month changes

  // 2. Events for the List View (Selected Date) - Keep existing logic
  const daySelectedEvents = useMemo(() => {
    return visibleEvents.filter((e: any) => {
      const s = e.start.date || e.start.dateTime?.split('T')[0];
      let end = e.end?.date || e.end?.dateTime?.split('T')[0] || s;

      const isGoogleAllDay = e.start.date && !e.id.startsWith('knu_');
      if (isGoogleAllDay && e.end?.date) {
        const endDateObj = new Date(end);
        endDateObj.setDate(endDateObj.getDate() - 1);
        end = endDateObj.toISOString().split('T')[0];
      }

      return selectedDate >= s && selectedDate <= end;
    });
  }, [visibleEvents, selectedDate]);

  const renderDay = useCallback(
    ({ date, state }: any) => {
      const dateStr = date.dateString;
      // Get the layout chunks starting on this day
      const dayEvents = processedEvents[dateStr] || [];
      const isSelected = dateStr === selectedDate;

      return (
        <CalendarDay
          date={date}
          state={state}
          events={dayEvents}
          isSelected={isSelected}
          onPress={(d) => {
            setSelectedDate(d);
            // Optional: If user selects a date, ensure currentMonth is synced if it somehow drifted
            // But usually onMonthChange handles the drift.
            // If we really want to force sync, we can do it here, but let's stick to standard behavior.
          }}
          dayWidth={dayWidth}
        />
      );
    },
    [processedEvents, selectedDate],
  );

  const formatTime = (dateTime: string) => {
    if (!dateTime) return '종일';
    return new Date(dateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const insets = useSafeAreaInsets();

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={28} color="rgb(219, 31, 38)" />
            <AppText style={styles.headerTitle}>캘린더</AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 15, alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <AppText style={{ fontSize: 12, color: '#666', marginRight: 6 }}>학부</AppText>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgb(219, 31, 38)' }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <AppText style={{ fontSize: 12, color: '#666', marginRight: 6 }}>대학원</AppText>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' }} />
              </View>
            </View>
            <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
              <Ionicons name="options-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={{ backgroundColor: 'white' }}>
          <CalendarHeightProvider itemHeight={itemHeight}>
            <Calendar
              current={currentMonth}
              onMonthChange={(month: any) => setCurrentMonth(month.dateString)}
              dayComponent={renderDay}
              monthFormat={'yyyy년 M월'}
              renderArrow={(direction: any) => (
                <Ionicons
                  name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                  size={28}
                  color="rgb(219, 31, 38)"
                />
              )}
              theme={
                {
                  textMonthFontWeight: 'bold',
                  textMonthFontSize: 18,
                  arrowColor: 'rgb(219, 31, 38)',
                  monthTextColor: '#000',
                  textDayHeaderFontWeight: 'bold',
                  todayTextColor: 'rgb(219, 31, 38)',
                  'stylesheet.calendar.header': {
                    week: {
                      marginTop: 5,
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                    },
                  },
                } as any
              }
              disableMonthChange={true} // Swiping handled by gesture
              enableSwipeMonths={false} // Disable default swipe to avoid conflict
              hideExtraDays={true}
            />
          </CalendarHeightProvider>

          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
            <AppText style={styles.dragText}>
              {isExpanded ? '위로 올려서 접기' : '아래로 당겨서 펼치기'}
            </AppText>
          </View>
        </Animated.View>
      </GestureDetector>

      <View style={styles.listHeaderContainer}>
        <AppText style={styles.listHeader}>{selectedDate} 일정</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isLoading && (
            <ActivityIndicator size="small" color="rgb(219, 31, 38)" style={{ marginRight: 8 }} />
          )}
          <AppText style={styles.eventCountText}>{daySelectedEvents.length}개</AppText>
        </View>
      </View>
    </>
  );

  // 0. Load saved filter mode on mount
  React.useEffect(() => {
    const loadFilter = async () => {
      if (userEmail && isAuthenticated) {
        const safeEmail = userEmail.replace(/\./g, '_');
        const savedFilter = (await getData(STORAGE_KEYS.FILTER_MODE(safeEmail))) as string;
        if (savedFilter) setFilterMode(savedFilter);
      }
    };
    loadFilter();
  }, [userEmail, isAuthenticated]);

  const handleFilterSelect = async (m: string) => {
    setFilterMode(m);
    setFilterModalVisible(false);
    if (userEmail) {
      const safeEmail = userEmail.replace(/\./g, '_');
      await saveData(STORAGE_KEYS.FILTER_MODE(safeEmail), m);
    }
  };

  if (!isAuthenticated) return <LoginPlaceholder targetScreen="Profile" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <FlatList
          data={daySelectedEvents}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View
                style={[
                  styles.typeIndicator,
                  { backgroundColor: item.type === 1 ? '#333' : 'rgb(219, 31, 38)' },
                ]}
              />
              <View style={styles.cardContent}>
                <AppText style={styles.title}>{item.summary}</AppText>
                <AppText style={styles.timeLabel}>
                  {item.start.date ? '하루 종일' : formatTime(item.start.dateTime)}
                </AppText>
              </View>
            </View>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<AppText style={styles.emptyText}>일정이 없습니다.</AppText>}
        />

        <Modal visible={isFilterModalVisible} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
            <View style={styles.modalContent}>
              <AppText style={styles.modalTitle}>일정 필터</AppText>
              {['all', 'undergraduate', 'graduate'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={styles.filterOption}
                  onPress={() => handleFilterSelect(m)}>
                  <AppText style={filterMode === m ? styles.activeFilterText : styles.filterText}>
                    {m === 'all' ? '전체' : m === 'undergraduate' ? '학부' : '대학원'}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dragHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, marginBottom: 4 },
  dragText: { fontSize: 10, color: '#aaa' },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  eventCountText: { fontSize: 14, color: '#888', fontWeight: '600' },
  listContent: { paddingBottom: 120 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  typeIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: 10 },
  cardContent: { flex: 1 },
  title: {
    fontSize: moderateScale(16, 0.3),
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
    includeFontPadding: false,
  },
  timeLabel: {
    fontSize: moderateScale(12, 0.3),
    color: '#999',
    includeFontPadding: false,
    lineHeight: moderateScale(16, 0.3),
  },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  filterOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterText: { fontSize: 16, color: '#666' },
  activeFilterText: { fontSize: 16, color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
});
