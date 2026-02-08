import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import DetailScreen from '../screens/DetailScreen';
import KeywordScreen from '../screens/KeywordScreen';
import BookmarkScreen from '../screens/BookmarkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TetrisScreen from '../screens/TetrisScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      id="RootStackNavigator"
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerTintColor: '#333',
        headerTitleAlign: 'left',
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="MainTab" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '상세 정보' }} />
      <Stack.Screen
        name="Keyword"
        component={KeywordScreen}
        options={{ title: '키워드 설정', headerShown: true }}
      />
      <Stack.Screen
        name="Bookmark"
        component={BookmarkScreen}
        options={{ title: '즐겨찾기', headerShown: true }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '내정보',
          headerShown: true,
          headerTransparent: true,
          headerTintColor: '#333',
          headerBackVisible: false, // 뒤로가기 버튼 숨김
        }}
      />
      <Stack.Screen
        name="Tetris"
        component={TetrisScreen}
        options={{ title: '테트리스', headerShown: true }}
      />
    </Stack.Navigator>
  );
}
