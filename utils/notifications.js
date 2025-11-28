// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// 알림 핸들러 설정 (앱이 실행 중일 때 알림이 오면 어떻게 할지)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 에뮬레이터인지 실제 기기인지 확인
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // 권한이 없으면 요청
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('알림 권한 필요', '푸시 알림을 받으려면 권한을 허용해주세요.');
      return;
    }

    // 토큰 발급
    // (EAS Build를 사용하는 경우 projectId가 필요할 수 있음)
    token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Expo Push Token:', token);
  } else {
    Alert.alert('알림 오류', '푸시 알림은 실제 기기에서만 테스트 가능합니다.');
  }

  return token;
}