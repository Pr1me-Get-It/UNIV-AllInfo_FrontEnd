// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  // 1. 프로젝트 ID 명시적 확보
  // app.config.js의 extra.eas.projectId 값을 가져옵니다.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.manifest?.extra?.eas?.projectId;

  if (!projectId) {
    console.error("🚨 Project ID를 찾을 수 없습니다. app.config.js 설정을 확인하세요.");
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('알림 권한 필요', '푸시 알림을 받으려면 권한을 허용해주세요.');
      return;
    }

    // 2. 토큰 발급 시 projectId 명시
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId, // 👈 명시적으로 전달
        });
        token = tokenData.data;
        console.log('📱 Mobile Push Token:', token);
    } catch (e) {
        console.error("토큰 발급 실패:", e);
    }
  } else {
    // Alert.alert('알림 오류', '푸시 알림은 실제 기기에서만 테스트 가능합니다.');
    console.log("에뮬레이터에서는 푸시 토큰이 발급되지 않습니다.");
  }

  return token;
}