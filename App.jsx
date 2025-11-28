/* pr1me-get-it/univ-allinfo_frontend/UNIV-AllInfo_FrontEnd-dev/App.jsx */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 화면들 import
import HomeScreen from './screen/HomeScreen';
import DetailScreen from './screen/DetailScreen';
import { AlramProvider } from './data/Alram';
import BookmarkScreen from './screen/BookmarkScreen';
import CalendarScreen from './screen/CalendarScreen';
import SettingsScreen from './screen/SettingsScreen';
import KeywordScreen from './screen/KeywordScreen';

// 유틸리티 및 API import [추가됨]
import { getToken } from './utils/storage';
import { registerForPushNotificationsAsync } from './utils/notifications';
import { api } from './api/client';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";

// 메인 탭 (하단 네비게이션) 설정
function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'rgb(219, 31, 38)',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 100,
          position: 'absolute',
          bottom: 0,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Bookmark"
        component={BookmarkScreen} 
        options={{ 
          title: '북마크',
          tabBarIcon: ({ color, size }) => ( <Ionicons name="star" size={size} color={color} /> ),
        }} 
      />
      <Tab.Screen 
        name="Keyword"
        component={KeywordScreen} 
        options={{ 
          title: '키워드',
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="pricetags" size={size} color={color} /> 
          ),
        }} 
      />
      <Tab.Screen 
        name="Calendar"
        component={CalendarScreen} 
        options={{ 
          title: '캘린더',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="All"
        component={SettingsScreen} 
        options={{ 
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

// 실제 App 컴포넌트
export default function App() {

  useEffect(() => {
    const syncUserWithBackend = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        let userEmail = null;

        // ✅ 토큰 확인: 개발자용 vs 구글용
        if (token === DEV_TOKEN) {
          console.log("⚡ [App.jsx] 개발자 모드 감지");
          userEmail = "test@knu.ac.kr"; // 개발자 이메일 하드코딩
        } else {
          // 구글 토큰이면 정보 가져오기
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!userInfoRes.ok) return;
          const userInfo = await userInfoRes.json();
          userEmail = userInfo.email;
        }

        // 푸시 토큰 가져오기 (실패시 null)
        let pushToken = null;
        try {
           pushToken = await registerForPushNotificationsAsync();
        } catch (e) {}

        // 백엔드 등록
        if (userEmail) {
          console.log(`📡 유저 자동 동기화: ${userEmail}`);
          await api.post('/user/register', {
            email: userEmail,
            expoPushToken: pushToken || null
          });
        }

      } catch (e) {
        console.error("유저 동기화 에러:", e);
      }
    };

    syncUserWithBackend();
  }, []);

  return (
    <AlramProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="MainTab" 
            component={MainTab} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Detail" 
            component={DetailScreen}
            options={{ title: '상세 정보' }} 
          />
          
        </Stack.Navigator>
      </NavigationContainer>
    </AlramProvider>
  );
}