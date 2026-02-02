import React, { useState, useEffect, useCallback } from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { applyGlobalFont } from './src/utils/globalFont'; // 추가

// 전역 폰트 적용 시도 (일부 RN 버전에서 작동)
applyGlobalFont();

// 화면들 import
import SplashScreenComponent from './src/screens/SplashScreen';
import RootNavigator from './src/navigation/RootNavigator';

import { AuthProvider } from './src/context/AuthContext';
import { AlarmProvider } from './src/data/Alarm';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';

// 앱 시작 시 기본 정적 이미지가 자동으로 숨겨지는 것을 방지
SplashScreen.preventAutoHideAsync();

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
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // 폰트 파일을 src/assets/fonts 폴더에 넣고 아래 주석을 해제하세요. (이름은 자유롭게 지정 가능)
          'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.otf'),
          'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.otf'),
          'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.otf'),
          'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.otf'),
        });
        console.log('✅ 폰트 로드 완료: Pretendard');
      } catch (e) {
        console.warn('⚠️ 폰트 로드 중 오류 발생:', e);
      }
    }

    // 폰트 로딩과 초기화 작업을 병렬로 처리하거나 순차적으로 처리
    const prepareApp = async () => {
      await loadFonts();
      prepare();
    };

    prepareApp();
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
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ flex: 1 }}>
        <AuthProvider>
          <AlarmProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AlarmProvider>
        </AuthProvider>
      </View>
    </QueryClientProvider>
  );
}
