/* src/utils/notifications.ts */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// 알림 핸들러 설정 (앱이 포그라운드 상태일 때 알림 표시 여부)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 엑스포 푸시 토큰 등록 및 권한 요청 함수
 * @returns 발급된 푸시 토큰 문자열 또는 undefined
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  // 1. 프로젝트 ID 확보
  // Expo Config에서 EAS 프로젝트 ID를 가져옵니다.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants.manifest as any)?.extra?.eas?.projectId;

  if (!projectId) {
    console.error('🚨 Project ID를 찾을 수 없습니다. app.config.js 설정을 확인하세요.');
  }

  // 2. 안드로이드 알림 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 3. 실제 기기 여부 및 권한 체크
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    // console.log(`🚀 [PushDebug] 현재 권한 상태: ${existingStatus}`);

    let finalStatus = existingStatus;

    // 권한이 없다면 요청
    if (existingStatus !== 'granted') {
      // console.log("🚀 [PushDebug] 권한 요청 시도...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      // console.log(`🚀 [PushDebug] 권한 요청 결과: ${finalStatus}`);
    }

    // 최종적으로 권한 거부 시 알림
    if (finalStatus !== 'granted') {
      // console.log("🚀 [PushDebug] 권한 거부됨");
      Alert.alert('알림 권한 필요', '푸시 알림을 받으려면 권한을 허용해주세요.');
      return;
    }

    // 4. 엑스포 푸시 토큰 발급 시도
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = tokenData.data;
      // console.log("✅ 푸시 토큰 발급 성공:", token);
    } catch (e) {
      console.error('❌ 푸시 토큰 발급 에러:', e);
    }
  } else {
    console.log('실제 기기에서만 푸시 알림이 작동합니다.');
  }

  return token;
}

/**
 * 테스트용 로컬 알림 발송 함수
 */
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 테스트알람',
      body: '잘 가지요?',
      data: { data: 'test-data' },
    },
    trigger: null, // 즉시 발송
  });
}
