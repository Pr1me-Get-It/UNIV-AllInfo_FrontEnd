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

// [Debug] 알림 리스너 추가 (앱 실행 시 즉시 등록)
Notifications.addNotificationReceivedListener(notification => {
  if (__DEV__) console.log('🔔 [NotificationDebug] Foreground 알림 수신:', JSON.stringify(notification, null, 2));
});

Notifications.addNotificationResponseReceivedListener(response => {
  if (__DEV__) console.log('🔔 [NotificationDebug] 알림 클릭(반응):', JSON.stringify(response, null, 2));
});

/**
 * 엑스포 푸시 토큰 등록 및 권한 요청 함수
 * @returns 발급된 푸시 토큰 문자열 또는 undefined
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;
  if (__DEV__) console.log('🔍 [NotificationDebug] registerForPushNotificationsAsync 시작');

  // 1. 프로젝트 ID 확보
  // Expo Config에서 EAS 프로젝트 ID를 가져옵니다.
  const HARDCODED_PROJECT_ID = '6120be3f-b18d-4531-af3f-af3f6db51bca'; // app.config.js 의 projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants.manifest as any)?.extra?.eas?.projectId ||
    HARDCODED_PROJECT_ID; // 릴리즈 빌드 fallback

  if (__DEV__) console.log('🔍 [NotificationDebug] Project ID:', projectId);

  if (!projectId) {
    console.error('🚨 [NotificationDebug] Project ID를 찾을 수 없습니다. app.config.js 설정을 확인하세요.');
  }

  // 2. 안드로이드 알림 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    if (__DEV__) console.log('🔍 [NotificationDebug] Android 채널 설정 완료');
  }

  // 3. 실제 기기 여부 및 권한 체크
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (__DEV__) console.log(`🔍 [NotificationDebug] 초기 권한 상태: ${existingStatus}`);

    let finalStatus = existingStatus;

    // 권한이 없다면 요청
    if (existingStatus !== 'granted') {
      if (__DEV__) console.log("🔍 [NotificationDebug] 권한 요청 시도...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      if (__DEV__) console.log(`🔍 [NotificationDebug] 권한 요청 결과: ${finalStatus}`);
    }

    // 최종적으로 권한 거부 시 알림
    if (finalStatus !== 'granted') {
      if (__DEV__) console.log("🔍 [NotificationDebug] 최종 권한 거부됨");
      Alert.alert('알림 권한 필요', '푸시 알림을 받으려면 권한을 허용해주세요.');
      return;
    }

    // 4. 엑스포 푸시 토큰 발급 시도
    try {
      if (__DEV__) console.log("🔍 [NotificationDebug] 토큰 발급 시도...");
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = tokenData.data;
      if (__DEV__) console.log("✅ [NotificationDebug] 푸시 토큰 발급 성공:", token);
    } catch (e) {
      console.error('❌ [NotificationDebug] 푸시 토큰 발급 에러:', e);
    }
  } else {
    if (__DEV__) console.log('🔍 [NotificationDebug] 실제 기기가 아닙니다 (Simulator/Emulator).');
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
      body: '빨리해',
      data: { data: 'test-data' },
    },
    trigger: null, // 즉시 발송
  });
}
