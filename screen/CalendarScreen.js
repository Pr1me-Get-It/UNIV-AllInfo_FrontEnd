// screen/CalendarScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars'; // 라이브러리 임포트
import { getToken } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

// [설정] 달력 한글화
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

export default function CalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 선택된 날짜 (초기값: 오늘)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useFocusEffect(
    useCallback(() => {
      fetchCalendarEvents();
    }, [])
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

      // 2025년 전체 데이터 가져오기 (필요에 따라 범위 조정 가능)
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

  // [핵심] API 데이터를 달력에 표시할 형태(markedDates)로 변환
  const markedDates = useMemo(() => {
    const marks = {};
    
    // 1. 일정이 있는 날짜에 점 찍기
    events.forEach(event => {
      // date(종일) 또는 dateTime(시간지정)에서 날짜 추출
      const start = event.start.date || event.start.dateTime?.split('T')[0];
      if (start) {
        marks[start] = { marked: true, dotColor: 'rgb(219, 31, 38)' };
      }
    });

    // 2. 현재 선택된 날짜 스타일 덮어쓰기
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}), // 기존 점 정보 유지
      selected: true,
      selectedColor: 'rgb(219, 31, 38)',
      disableTouchEvent: true
    };

    return marks;
  }, [events, selectedDate]);

  // 하단 리스트에 보여줄 '선택된 날짜의 일정' 필터링
  const filteredEvents = events.filter(event => {
    const start = event.start.date || event.start.dateTime?.split('T')[0];
    return start === selectedDate;
  });

  // 시간 포맷팅
  const formatTime = (dateTime) => {
    if (!dateTime) return '종일'; // 시간이 없으면 종일 일정
    return new Date(dateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!loading && !isLoggedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>로그인이 필요합니다.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Settings')}>
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
        // 기본적으로 오늘 날짜가 속한 달을 보여줌
        current={selectedDate}
        
        // 날짜 클릭 시 실행
        onDayPress={day => {
          setSelectedDate(day.dateString);
        }}
        
        // 월 이동 화살표 보이기 (기본값 true지만 명시)
        hideArrows={false}
        
        // 데이터 표시 (점, 선택 배경색 등)
        markedDates={markedDates}
        // 월 표시 포맷
        monthFormat={'yyyy년 M월'}
        // 화살표 커스텀
        renderArrow={(direction) => (
          <Ionicons 
            name={direction === 'left' ? "chevron-back" : "chevron-forward"}
            size={28}  // 원하는 크기로 조절 (기본값보다 큼)
            color="rgb(219, 31, 38)"
          />
        )}
        // 테마 커스텀
        theme={{
          todayTextColor: 'rgb(219, 31, 38)',
          arrowColor: 'rgb(219, 31, 38)',
          selectedDayBackgroundColor: 'rgb(219, 31, 38)',
          dotColor: 'rgb(219, 31, 38)',
        }}
      />

      {/* 2. 선택된 날짜의 일정 리스트 */}
      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>{selectedDate} 일정</Text>
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
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