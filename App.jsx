// App.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // [추가] 스택 내비게이터
import { Ionicons } from '@expo/vector-icons';

// [추가] 화면들 import
import HomeScreen from './HomeScreen';
import Calculator from './Calculator';
import DetailScreen from './DetailScreen';
import RandomStack from './randomstack';
import { AlramProvider } from './data/Alram';
import ItemsListScreen from './screen/ItemsListScreen';
import ItemDetailScreen from './screen/ItemDetailScreen';
import ItemCreateScreen from './screen/ItemCreateScreen';
import ItemEditScreen from './screen/ItemEditScreen';
import { ItemsProvider } from './data/ItemsContext';
import BookmarkScreen from './screen/BookmarkScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 

// 기존 App 함수에 있던 탭 설정을 별도 컴포넌트로 분리
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
          borderTopLeftRadius: 20,   // 살짝 수정 (너무 크면 깨질 수 있음)
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderWidth: 0,
          height: 80,               // 높이 살짝 여유 있게
          position: 'absolute',     // absolute로 해야 둥근 모서리 뒤 배경이 보임 (선택사항)
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

      {/* 3. 필터 */}
      <Tab.Screen 
        name="Shopping"
        component={ItemsListScreen} 
        options={{ 
          title: '필터',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="filter-outline" size={size} color={color} />
          ),
        }} 
      />

      {/* 4. 증권 */}
      <Tab.Screen 
        name="Stocks"
        component={RandomStack} 
        options={{ 
          title: '증권',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }} 
      />

      {/* 5. 설정 */}
      <Tab.Screen 
        name="All"
        component={Calculator} 
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
    <ItemsProvider>
      <NavigationContainer>
        <Stack.Navigator>
        {/* 1. 메인 탭 화면 (기본 화면) */}
        <Stack.Screen 
          name="MainTab" 
          component={MainTab} 
          options={{ headerShown: false }} // 탭 화면에선 스택 헤더 숨김
        />

        {/* 2. 상세 화면 (여기서 등록해야 연결됨) */}
        <Stack.Screen 
          name="Detail" 
          component={DetailScreen}
          options={{ title: '상세 정보' }} // 필요시 헤더 제목 설정
        />
        <Stack.Screen 
            name="ItemDetail" 
            component={ItemDetailScreen} 
            options={{ title: '상품 상세' }}
          />

          <Stack.Screen 
            name="Create" 
            component={ItemCreateScreen} 
            options={{ title: '상품 등록' }}
          />

          <Stack.Screen 
            name="Edit" 
            component={ItemEditScreen} 
            options={{ title: '상품 수정' }}
          />

		
        </Stack.Navigator>
      </NavigationContainer>
    </ItemsProvider>
	</AlramProvider>
  );
}