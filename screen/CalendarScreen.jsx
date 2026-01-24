import React, { useState, useCallback, useMemo, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getToken, saveToken, removeToken } from '../utils/storage';
import { AlarmContext } from '../data/Alarm';
import { useAuth } from '../context/AuthContext';
import LoginPlaceholder from '../components/ui/LoginPlaceholder'
import academicSchedule from '../constants/academic_schedule.json';

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

export default function CalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [filterMode, setFilterMode] = useState('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  const { userEmail, isAuthenticated } = useAuth();
  const { mockEvents } = useContext(AlarmContext) || {};

  useFocusEffect(
    useCallback(() => {
      if (userEmail) fetchCalendarEvents();
    }, [userEmail, mockEvents])
  );

  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const storedToken = await getToken();
      if (!storedToken) return;
      
      let accessToken = storedToken;
      try {
        const tokens = await GoogleSignin.getTokens();
        if (tokens.accessToken) accessToken = tokens.accessToken;
      } catch (e) {}

      const timeMin = new Date('2025-01-01T00:00:00Z').toISOString();
      const timeMax = new Date('2025-12-31T23:59:59Z').toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents([...(data.items || []), ...academicSchedule]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const visibleEvents = useMemo(() => {
    return events.filter(event => {
      if (filterMode === 'all') return true;
      const type = event.hasOwnProperty('type') ? event.type : -1;
      return filterMode === 'undergraduate' ? type === 0 : type === 1;
    });
  }, [events, filterMode]);

  // 성능 최적화: 선택된 날짜의 일정만 메모이제이션하여 필터링
  const daySelectedEvents = useMemo(() => {
    return visibleEvents.filter(e => {
      const s = e.start.date || e.start.dateTime?.split('T')[0];
      const end = e.end?.date || e.end?.dateTime?.split('T')[0] || s;
      return selectedDate >= s && selectedDate <= end;
    });
  }, [visibleEvents, selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = {};
    const sorted = [...visibleEvents].sort((a, b) => a.id.localeCompare(b.id));

    sorted.forEach(event => {
      const start = event.start.date || event.start.dateTime?.split('T')[0];
      const end = event.end?.date || event.end?.dateTime?.split('T')[0] || start;
      if (start) {
        const range = getDatesInRange(start, end);
        range.forEach((date, index) => {
          if (!map[date]) map[date] = [];
          const type = event.hasOwnProperty('type') ? event.type : -1;
          map[date].push({
            id: event.id,
            color: type === 1 ? '#E0F2FE' : (type === 0 ? '#FEE2E2' : '#E3F2FD'),
            isStart: index === 0,
            isEnd: index === range.length - 1
          });
        });
      }
    });
    return map;
  }, [visibleEvents]);

  const renderDay = useCallback(({ date, state }) => {
    const dateStr = date.dateString;
    const dayEvents = eventsByDate[dateStr] || [];
    const isSelected = dateStr === selectedDate;
    const isToday = state === 'today';
    const blockHeight = 10;

    return (
      <TouchableOpacity 
        style={[styles.dayBox, isSelected && styles.selectedDayBox]} 
        onPress={() => setSelectedDate(dateStr)}
      >
        <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>
          {date.day}
        </Text>
        <View style={styles.eventContainer}>
          {dayEvents.slice(0, 3).map((ev, i) => (
            <View 
              key={`${ev.id}-${i}`} 
              style={[
                styles.block, 
                { 
                  backgroundColor: ev.color, 
                  height: blockHeight - 1,
                  borderTopLeftRadius: ev.isStart ? 4 : 0,
                  borderBottomLeftRadius: ev.isStart ? 4 : 0,
                  borderTopRightRadius: ev.isEnd ? 4 : 0,
                  borderBottomRightRadius: ev.isEnd ? 4 : 0,
                }
              ]} 
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  }, [eventsByDate, selectedDate]);

  const formatTime = (dateTime) => {
    if (!dateTime) return '종일';
    return new Date(dateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) return <LoginPlaceholder />;

  return (
    <View style={styles.container}>
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

      <Calendar
        current={selectedDate}
        dayComponent={renderDay}
        monthFormat={'yyyy년 M월'}
        renderArrow={(direction) => (
          <Ionicons name={direction === 'left' ? "chevron-back" : "chevron-forward"} size={28} color="rgb(219, 31, 38)" />
        )}
        theme={{ todayTextColor: 'rgb(219, 31, 38)' }}
      />

      <View style={styles.listContainer}>
        <View style={styles.listHeaderContainer}>
            <Text style={styles.listHeader}>{selectedDate} 일정</Text>
            <Text style={styles.eventCountText}>{daySelectedEvents.length}개</Text>
        </View>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>일정이 없습니다.</Text>}
        />
      </View>

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
  
  dayBox: { width: dayWidth, height: 55, alignItems: 'center', paddingTop: 5 },
  selectedDayBox: { backgroundColor: 'rgba(219, 31, 38, 0.05)', borderRadius: 8 },
  dayText: { fontSize: 15, color: '#333' },
  todayText: { color: 'rgb(219, 31, 38)', fontWeight: 'bold' },
  selectedDayText: { fontWeight: 'bold' },
  eventContainer: { width: '100%', marginTop: 2, paddingHorizontal: 1 },
  block: { width: '112%', marginBottom: 1 },

  listContainer: { 
    flex: 1, 
    backgroundColor: '#f9f9f9', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25,
    marginTop: -5 
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  eventCountText: { fontSize: 14, color: '#888', fontWeight: '600' },
  listContent: { paddingBottom: 120 },
  
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
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