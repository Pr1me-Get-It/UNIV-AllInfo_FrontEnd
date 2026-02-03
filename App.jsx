import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';  // : 하단에 아이콘들 쭉 들어가는 'BottomTabNavigator'를 만드는 것
import { createNativeStackNavigator } from '@react-navigation/native-stack';  // : 위로 쌓였다가 뒤로 가기 가능한 '스택 네비게이션'을 만드는 것
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



function MainTab() {      // : 하단의 5개 탭 <탭 네바게이션> 
                          // <Tab.Navigator> 안에 <Tab.Screen> 5개가 들어있는 형대
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
      <Tab.Screen        // 하단 탭 5개들      * maintab의 첫 화면은 HomeScreen. (젤 위에 있으므로 젤 먼저 보여짐)
        name="Home" 
        component={HomeScreen}  // Home이라는 탭에 HomeScreen 컴포넌트를 연결함. 탭에서 이 아이콘을 누르면 해당 컴포넌트로 이동됨.
        options={{              // 탭 이름, 아이콘 등 설정
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
          tabBarIcon: ({ color, size }) => ( 
            <Ionicons name="star" size={size} color={color} /> 
          ),
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
    <AlramProvider> {/* Alarm.js에서 가져온 알림의 상태(읽음, 북마크상태)를  앱 전체에서 공유할 수 있음 -> useContext(AlramContext) */}
                    {/* AlarmProvider 안에 있는 모든 화면들은 AlarmContext의 value들을 공요해서 쓸 수 있음! */}
      <NavigationContainer>
        <Stack.Navigator>  {/* 스택 네비게이션의 틀 */}
          <Stack.Screen 
            name="MainTab" 
            component={MainTab} 
            options={{ headerShown: false }} 
          />

          {/* 2. 일반 상세 화면 (기존 기능) */}
          <Stack.Screen 
            name="Detail"     // => HomeScreen에서 navigation.navigate('Detail', { item }); 라고 부르면, DetailScreen을 불러와 화면 위에 쌓게 됨.
            component={DetailScreen}    
            options={{ title: '상세 정보' }} 
          />
        </Stack.Navigator> {/* : 스택 구조를 만들 건데, 첫 화면은 maintab이고 스택 구조의 다음화면으로 DetailScreen을 띄울 수 있음. */}
      </NavigationContainer>
    </AlramProvider>
  );
}