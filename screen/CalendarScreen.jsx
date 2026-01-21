import React, { useState, useCallback, useMemo, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars'; 
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin'; 
import { getToken, saveToken, removeToken } from '../utils/storage';
import { AlarmContext } from '../data/Alarm';
import { useAuth } from '../context/AuthContext';
import LoginPlaceholder from '../components/ui/LoginPlaceholder'

LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const TODAY_STR = new Date().toISOString().split('T')[0];

export default function CalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const { userEmail, isAuthenticated } = useAuth();
  const { mockEvents } = useContext(AlarmContext) || {};

  useFocusEffect(
    useCallback(() => {
      if (userEmail) {
        setIsLoggedIn(true);
        fetchCalendarEvents();
      } else {
        setIsLoggedIn(false);
        setEvents([]);
      }
    }, [userEmail, mockEvents])
  );


  const fetchCalendarEvents = async (retryCount = 0) => {
    if (retryCount === 0) setLoading(true);
    
    try {
      const storedToken = await getToken();
      
      if (!storedToken) {
        setIsLoggedIn(false);
        setEvents([]);
        setLoading(false);
        return;
      }

      if (storedToken === DEV_TOKEN) {
        console.log("⚡ [Calendar] 개발자 모드");
        setEvents(mockEvents); 
        setLoading(false);
        return;
      }

      // 1. 현재 사용 가능한 토큰 가져오기
      let accessToken = storedToken;
      try {
          const tokens = await GoogleSignin.getTokens();
          if (tokens.accessToken) {
              accessToken = tokens.accessToken;
          }
      } catch (e) {}

      console.log(`📅 캘린더 조회 시도 (${retryCount + 1}회차)...`);

      const timeMin = new Date('2025-01-01T00:00:00Z').toISOString();
      const timeMax = new Date('2025-12-31T23:59:59Z').toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true&maxResults=2500`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.items || []);
        console.log("✅ 캘린더 로드 성공!");
      } else {
        console.log(`❌ 캘린더 에러: ${response.status}`);

        // 🚨 2. 401 에러(권한 없음) 발생 시 자동 복구 로직
        if (response.status === 401 && retryCount < 2) {
            console.log("🔄 토큰 만료/오류 감지. 캐시 삭제 후 재발급 시도...");
            
            try {
                // (1) 기존 캐시된 토큰 제거 (이게 중요합니다!)
                await GoogleSignin.clearCachedAccessToken(accessToken);
                
                // (2) 조용히 재로그인해서 새 토큰 발급
                const userInfo = await GoogleSignin.signInSilently();
                const newTokens = await GoogleSignin.getTokens();
                
                if (newTokens.accessToken) {
                    await saveToken(newTokens.accessToken); // 저장소 업데이트
                    console.log("✨ 새 토큰 발급 완료. 재시도합니다.");
                    return fetchCalendarEvents(retryCount + 1); // 재귀 호출
                }
            } catch (refreshError) {
                console.log("⚠️ 토큰 갱신 실패:", refreshError);
            }
        }
        
        // 복구 실패 시 빈 화면 유지 (로그아웃은 안 시킴)
        setEvents([]);
      }
    } catch (e) {
      console.error('캘린더 로직 에러:', e);
    } finally {
      if (retryCount === 0) setLoading(false);
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
   if (!isAuthenticated) {
    return <LoginPlaceholder />;
  }
  if (!loading && !isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <Ionicons name="lock-closed-outline" size={60} color="#ccc" style={{ marginBottom: 20 }} />
        <Text style={styles.msg}>로그인이 필요한 기능입니다.</Text>
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

      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>{selectedDate} 일정</Text>
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
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
  loginContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
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