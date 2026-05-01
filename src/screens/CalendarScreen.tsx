import React, { useCallback } from 'react';
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
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from '../utils/responsive';
import CalendarDay from '../components/CalendarDay';
import { RouteProp } from '@react-navigation/native';
import { useCalendarLogic } from '../hooks/screens/useCalendarLogic';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// 한국어 설정
LocaleConfig.locales['kr'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'kr';

const screenWidth = Dimensions.get('window').width;
const dayWidth = (screenWidth - 32) / 7;

type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTab'>;
type CalendarScreenRouteProp = RouteProp<RootStackParamList, 'MainTab'>;

interface Props {
  navigation: CalendarScreenNavigationProp;
  route: CalendarScreenRouteProp;
}

export default function CalendarScreen({ navigation, route }: Props) {
  const {
    selectedDate,
    setSelectedDate,
    filterMode,
    isFilterModalVisible,
    setFilterModalVisible,
    currentMonth,
    setCurrentMonth,
    isLoading,
    processedEvents,
    updatedMarkedDates,
    daySelectedEvents,
    holidayDates,
    handleFilterSelect,
  } = useCalendarLogic(navigation, route);

  const renderDay = useCallback(
    ({ date, state }: any) => {
      const dateStr = date.dateString;
      const dayEvents = processedEvents[dateStr] || [];
      const isSelected = dateStr === selectedDate;

      return (
        <CalendarDay
          date={date}
          state={state}
          events={dayEvents}
          isSelected={isSelected}
          isHolidayDate={holidayDates.has(dateStr)}
          onPress={(d) => {
            setSelectedDate(d);
          }}
          dayWidth={dayWidth}
        />
      );
    },
    [processedEvents, selectedDate, holidayDates, setSelectedDate],
  );

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
            <AppText style={styles.headerTitle}>캘린더</AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 15, alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <AppText style={{ fontSize: 12, color: '#666', marginRight: 6 }}>학사일정</AppText>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgb(219, 31, 38)' }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <AppText style={{ fontSize: 12, color: '#666', marginRight: 6 }}>내가 추가한 일정</AppText>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' }} />
              </View>
            </View>
            <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
              <Ionicons name="options-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Calendar
        current={currentMonth}
        markedDates={updatedMarkedDates}
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
        disableMonthChange={true}
        enableSwipeMonths={false}
        hideExtraDays={true}
      />

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

  return (
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
                  {m === 'all' ? '전체' : m === 'undergraduate' ? '학사일정' : '내가 추가한 일정'}
                </AppText>
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
