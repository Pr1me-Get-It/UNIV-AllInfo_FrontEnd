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

  // [웹 환경 처리]
  if (Platform.OS === 'web') {
    try {
      // 1. 웹에서는 권한 요청이 비동기로 다르게 동작할 수 있음
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('알림 권한 필요', '웹 푸시 알림을 받으려면 권한을 허용해주세요.');
        return;
      }

      // 2. [수정] getExpoPushTokenAsync 호출 시 applicationId와 projectId를 명시적으로 전달
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId, // app.config.js의 extra.eas.projectId 값
        applicationId: 'com.univallinfo.app' // app.config.js의 package/bundleIdentifier와 일치하는 값
      })).data;

      console.log('Web Push Token:', token);
      return token;

    } catch (e) {
      console.error('웹 푸시 토큰 발급 실패:', e);
      return null;
    }
  }

  // [안드로이드 채널 설정]
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // [모바일 디바이스 처리]
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

    token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Mobile Push Token:', token);
  } else {
    Alert.alert('알림 오류', '푸시 알림은 실제 기기에서만 테스트 가능합니다.');
  }

  return token;
}