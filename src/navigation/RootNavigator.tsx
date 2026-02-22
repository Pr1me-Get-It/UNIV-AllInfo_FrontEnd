import React, { Suspense } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import TabNavigator from './TabNavigator';

// Lazy load screens
const DetailScreen = React.lazy(() => import('../screens/DetailScreen'));
const KeywordScreen = React.lazy(() => import('../screens/KeywordScreen'));
const BookmarkScreen = React.lazy(() => import('../screens/BookmarkScreen'));
const ProfileScreen = React.lazy(() => import('../screens/ProfileScreen'));
const TetrisScreen = React.lazy(() => import('../screens/TetrisScreen'));
const AppleGameScreen = React.lazy(() => import('../game/apple/AppleGameScreen'));
const FlappyBirdScreen = React.lazy(() => import('../game/flappybird/FlappyBirdScreen'));
const RankingScreen = React.lazy(() => import('../screens/RankingScreen'));
const LinkSettingScreen = React.lazy(() => import('../screens/LinkSettingScreen'));

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

export default function RootNavigator() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
            headerShown: false, // 헤더 숨김
          }}
        />
        <Stack.Screen
          name="Tetris"
          component={TetrisScreen}
          options={{ title: '테트리스', headerShown: true }}
        />
        <Stack.Screen
          name="AppleGame"
          component={AppleGameScreen}
          options={{ title: '사과 게임', headerShown: false }}
        />
        <Stack.Screen
          name="FlappyBird"
          component={FlappyBirdScreen}
          options={{ title: '플래피 버드', headerShown: false }}
        />
        <Stack.Screen
          name="Ranking"
          component={RankingScreen}
          options={{ title: '게임 랭킹', headerShown: true }}
        />
        <Stack.Screen
          name="LinkSetting"
          component={LinkSettingScreen}
          options={{
            headerShown: false,
            animation: 'fade', // 애니메이션이 느리다고 하여 가장 빠르고 간결한 fade(혹은 default) 체제로 변경
            animationDuration: 150, // Android 기준 전환 속도
          }}
        />
      </Stack.Navigator>
    </Suspense>
  );
}
