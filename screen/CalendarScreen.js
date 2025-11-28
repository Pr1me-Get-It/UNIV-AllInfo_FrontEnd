import React, { useState, useCallback, useMemo, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars'; 
import { getToken } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { AlramContext } from '../data/Alram';

// [설정] 달력 한글화
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

// 개발자 모드용 상수 및 가짜 데이터
const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const TODAY_STR = new Date().toISOString().split('T')[0]; // 오늘 날짜

const MOCK_EVENTS = [
  {
    id: 'dev-1',
    summary: '[개발] 캡스톤 디자인 미팅',
    location: 'IT-4호관',
    start: { dateTime: `${TODAY_STR}T10:00:00` }, // 오늘 시간 지정 일정
  },
  {
    id: 'dev-2',
    summary: '[개발] 백엔드 API 연동 테스트',
    start: { date: TODAY_STR }, // 오늘 종일 일정
  },
  {
    id: 'dev-3',
    summary: '[개발] 중간고사 기간',
    start: { date: '2025-04-20' },
  },
  {
    id: 'dev-4',
    summary: '[개발] 여름방학 시작',
    start: { date: '2025-06-21' },
  }
];

export default function CalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { mockEvents } = useContext(AlramContext);
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);

  useFocusEffect(
    useCallback(() => {
      fetchCalendarEvents();
    }, [mockEvents])
  );

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      //개발자 토큰이면 가짜 데이터 사용
      if (token === DEV_TOKEN) {
        console.log("⚡ [Calendar] 개발자 모드: 가짜 일정 로드 (Context)");
        setEvents(mockEvents); // Context에 있는 데이터를 그대로 사용
        setLoading(false);
        return;
      }

      // (일반 사용자) 구글 캘린더 API 호출
      const timeMin = new Date('2025-01-01T00:00:00Z').toISOString();
      const timeMax = new Date('2025-12-31T23:59:59Z').toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true&maxResults=2500`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.items || []);
      } else {
        console.log('캘린더 조회 실패:', response.status);
      }
    } catch (e) {
      console.error('캘린더 에러:', e);
    } finally {
      setLoading(false);
    }
  };

  const markedDates = useMemo(() => {
    const marks = {};
    
    events.forEach(event => {
      const start = event.start.date || event.start.dateTime?.split('T')[0];
      if (start) {
        marks[start] = { marked: true, dotColor: 'rgb(219, 31, 38)' };
      }
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: 'rgb(219, 31, 38)',
      disableTouchEvent: true
    };

    return marks;
  }, [events, selectedDate]);

  const filteredEvents = events.filter(event => {
    const start = event.start.date || event.start.dateTime?.split('T')[0];
    return start === selectedDate;
  });

  const formatTime = (dateTime) => {
    if (!dateTime) return '종일';
    return new Date(dateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!loading && !isLoggedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>로그인이 필요합니다.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('All')}>
          <Text style={styles.btnText}>로그인 하러 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="rgb(219, 31, 38)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. 달력 UI */}
      <Calendar
        current={selectedDate}
        onDayPress={day => setSelectedDate(day.dateString)}
        hideArrows={false}
        markedDates={markedDates}
        monthFormat={'yyyy년 M월'}
        renderArrow={(direction) => (
          <Ionicons 
            name={direction === 'left' ? "chevron-back" : "chevron-forward"}
            size={28}
            color="rgb(219, 31, 38)"
          />
        )}
        theme={{
          todayTextColor: 'rgb(219, 31, 38)',
          arrowColor: 'rgb(219, 31, 38)',
          selectedDayBackgroundColor: 'rgb(219, 31, 38)',
          dotColor: 'rgb(219, 31, 38)',
        }}
      />

      {/* 2. 일정 리스트 */}
      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>{selectedDate} 일정</Text>
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>일정이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.timeText}>
                {item.start.date ? '하루 종일' : formatTime(item.start.dateTime)}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.summary || '(제목 없음)'}</Text>
                {item.location && <Text style={styles.location}>📍 {item.location}</Text>}
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  listContainer: { 
    flex: 1, 
    backgroundColor: '#f9f9f9', 
    paddingHorizontal: 20, 
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  timeText: { 
    fontSize: 12, 
    color: '#888', 
    marginRight: 15, 
    width: 60, 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  title: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  location: { fontSize: 12, color: '#666' },
  
  msg: { fontSize: 16, color: '#888', marginBottom: 15 },
  btn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 20 },
});