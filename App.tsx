/* App.tsx */
import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';

// 화면들 import
import HomeScreen from './screen/HomeScreen';
import NoticeScreen from './screen/NoticeScreen';
import DetailScreen from './screen/DetailScreen';
import BookmarkScreen from './screen/BookmarkScreen';
import CalendarScreen from './screen/CalendarScreen';
import ProfileScreen from './screen/ProfileScreen';
import KeywordScreen from './screen/KeywordScreen';
import MapScreen from './screen/MapScreen';
import SplashScreenComponent from './screen/SplashScreen';

import { AuthProvider } from './context/AuthContext';
import { AlarmProvider } from './data/Alarm';

// 앱 시작 시 기본 정적 이미지가 자동으로 숨겨지는 것을 방지
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTab() {
  return (
    <Tab.Navigator id="MainTabNavigator"
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈', tabBarIcon: ({ color, size }) => (<Ionicons name="home" size={size} color={color} />) }} />
      <Tab.Screen name="Notice" component={NoticeScreen} options={{ title: '공지사항', tabBarIcon: ({ color, size }) => (<Ionicons name="notifications" size={size} color={color} />) }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: '학교지도', tabBarIcon: ({ color, size }) => (<Ionicons name="map-outline" size={size} color={color} />) }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: '캘린더', tabBarIcon: ({ color, size }) => (<Ionicons name="calendar-outline" size={size} color={color} />) }} />
      <Tab.Screen name="All" component={ProfileScreen} options={{ title: '내정보', tabBarIcon: ({ color, size }) => (<Ionicons name="person-outline" size={size} color={color} />) }} />
    </Tab.Navigator>
  );
}

export default function App() {
  // ⭐ 1. 모든 Hooks는 반드시 컴포넌트 최상단에 위치해야 합니다.
  const [isAppReady, setIsAppReady] = useState(false);
  const [isShowSplash, setIsShowSplash] = useState(false);

  const prepare = async () => {
    try {
      // 리소스 로딩 (데이터 로드 등)
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (e) {
      console.warn(e);
    } finally {
      setIsAppReady(true);
    }
  };

  useEffect(() => {
    prepare();
  }, []);

  // 기본 스플래시를 숨기는 함수 (메인 앱 렌더링 시 호출됨)
  const onLayoutRootView = useCallback(async () => {
    if (isAppReady) {
      // 여기서 네이티브 스플래시를 숨겨야 커스텀 애니메이션이 보입니다.
      await SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  // ⭐ 2. 조건부 반환(return)은 모든 Hook 선언이 끝난 뒤에 와야 합니다.
  
  // 아직 리소스가 준비되지 않았을 때
  if (!isAppReady) return null;

  // 커스텀 애니메이션 스플래시를 보여줄 때
  if (isShowSplash) {
    return (
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SplashScreenComponent onFinish={() => setIsShowSplash(false)} />
      </View>
    );
  }

  // 최종 메인 앱 렌더링
  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <AlarmProvider>
          <NavigationContainer>
            <Stack.Navigator id="RootStackNavigator">
              <Stack.Screen name="MainTab" component={MainTab} options={{ headerShown: false }} />
              <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '상세 정보' }} />
              <Stack.Screen name="Keyword" component={KeywordScreen} options={{ title: '뒤로가기', headerShown: true, headerTintColor: '#000' }} />
              <Stack.Screen name="Bookmark" component={BookmarkScreen} options={{ title: '뒤로가기', headerShown: true }} />
            </Stack.Navigator>
          </NavigationContainer>
        </AlarmProvider>
      </AuthProvider>
    </View>
  );
}