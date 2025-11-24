import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'user_access_token';

// 토큰 저장
export const saveToken = async (token) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error("Local storage error:", e);
    }
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

// 토큰 가져오기
export const getToken = async () => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error("Local storage error:", e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }
};

// 토큰 삭제 (로그아웃)
export const removeToken = async () => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error("Local storage error:", e);
    }
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};