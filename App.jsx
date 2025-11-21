import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 화면들 import
import HomeScreen from './HomeScreen';
import Calculator from './Calculator';
import DetailScreen from './DetailScreen';
import RandomStack from './randomstack';
import { AlramProvider } from './data/Alram';
import BookmarkScreen from './screen/BookmarkScreen';

// 아이템(쇼핑) 관련 화면 import
import ItemsListScreen from './screen/ItemsListScreen';
import ItemDetailScreen from './screen/ItemDetailScreen';
import ItemCreateScreen from './screen/ItemCreateScreen';
import ItemEditScreen from './screen/ItemEditScreen';

// [삭제됨] 더 이상 Context를 사용하지 않으므로 ItemsProvider import 제거
// import { ItemsProvider } from './data/ItemsContext'; 

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

          {/* 3. 아이템 CRUD 관련 스택 화면 */}
          {/* 이전 단계 파일들에서 navigation.navigate('ItemDetail') 등으로 호출하므로 이름을 맞춤 */}
          
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
    </AlramProvider>
  );
}