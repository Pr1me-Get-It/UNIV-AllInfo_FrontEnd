import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 화면들 import
import HomeScreen from './HomeScreen';
import DetailScreen from './DetailScreen';
import { AlramProvider } from './data/Alram';
import BookmarkScreen from './screen/BookmarkScreen';
import CalendarScreen from './screen/CalendarScreen';
import SettingsScreen from './screen/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 

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
          height: 80,
          position: 'absolute',
          bottom: 0,
        }
      }}
    >
      {/* 1. 홈 */}
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

      {/* 2. 북마크 */}
      <Tab.Screen 
        name="Bookmark"
        component={BookmarkScreen} 
        options={{ 
          title: '북마크',
          tabBarIcon: ({ color, size }) => ( <Ionicons name="star" size={size} color={color} /> ),
        }} 
      />

      {/* 3. 필터 (쇼핑 리스트) */}
      <Tab.Screen 
        name="Shopping"
        component={BookmarkScreen} 
        options={{ 
          title: '필터',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="filter-outline" size={size} color={color} />
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

      {/* 4. 설정 */}
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
  return (
    <AlramProvider>
      {/* ItemsProvider 제거: 이제 api/items.js를 통해 직접 서버와 통신합니다. */}
      <NavigationContainer>
        <Stack.Navigator>
          
          {/* 1. 메인 탭 화면 (기본 화면) */}
          <Stack.Screen 
            name="MainTab" 
            component={MainTab} 
            options={{ headerShown: false }} 
          />

          {/* 2. 일반 상세 화면 (기존 기능) */}
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