import React, { useState, useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// 전역 폰트 적용 시도 (일부 RN 버전에서 작동)
// applyGlobalFont(); // React 19에서 defaultProps 지원 중단으로 인해 제거됨

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AlarmProvider } from './src/data/Alarm';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'IBMPlexSansKR-Regular': require('./src/assets/fonts/IBMPlexSansKR-Regular.otf'),
          'IBMPlexSansKR-Bold': require('./src/assets/fonts/IBMPlexSansKR-Bold.otf'),
          'IBMPlexSansKR-Medium': require('./src/assets/fonts/IBMPlexSansKR-Medium.otf'),
          'IBMPlexSansKR-SemiBold': require('./src/assets/fonts/IBMPlexSansKR-SemiBold.otf'),
        });
        console.log('✅ 폰트 로드 완료: IBM Plex Sans KR');
      } catch (e) {
        console.warn('⚠️ 폰트 로드 중 오류 발생:', e);
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
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AlarmProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
