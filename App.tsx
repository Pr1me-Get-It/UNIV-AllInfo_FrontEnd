import React, { useState, useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// 전역 폰트 적용 시도 (일부 RN 버전에서 작동)
// applyGlobalFont(); // React 19에서 defaultProps 지원 중단으로 인해 제거됨

import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { handleNotificationResponse } from './src/utils/notifications';
import { AuthProvider } from './src/context/AuthContext';
import { AlarmProvider } from './src/data/Alarm';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 폰트 로드
        await Font.loadAsync({
          'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.otf'),
          'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.otf'),
          'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.otf'),
          'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.otf'),
        });

        // 주요 이미지 에셋 미리 로드 (캐싱)
        // Asset.fromModule(require(...)).downloadAsync()는 로컬 에셋을 캐시로 로드합니다.
        // 큰 이미지나 게임 에셋 위주로 로드
        /* 
           Note: Asset loading isn't strictly necessary for local require() but can help with 
           decoding delay on some devices. 
        */

        console.log('✅ 리소스 로드 완료');
      } catch (e) {
        console.warn('⚠️ 리소스 로드 중 오류 발생:', e);
      } finally {
        setIsAppReady(true);
      }
    }

    prepare();
  }, []);

  if (!isAppReady) {
    return null; // 또는 로딩 인디케이터
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AlarmProvider>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => {
                Notifications.getLastNotificationResponseAsync().then(response => {
                  if (!response) return;
                  // 60초 이내 알림만 처리 — 이전 세션의 stale 응답 재처리 방지
                  const age = Date.now() - response.notification.date * 1000;
                  if (age > 60000) return;
                  handleNotificationResponse(response);
                });
              }}>
              <RootNavigator />
            </NavigationContainer>
          </AlarmProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
