import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'user_access_token';
const USER_INFO_KEY = 'user_info'; // 사용자 정보 키 추가
const LIKED_NOTICES_KEY = 'user_liked_notices'; // 좋아요 목록 키 추가

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

export const saveData = async (key, value) => {
  const jsonValue = JSON.stringify(value);
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, jsonValue); } catch (e) {}
  } else {
    // SecureStore는 용량 제한이 있지만, 텍스트 위주의 북마크 리스트는 충분히 저장 가능합니다.
    await SecureStore.setItemAsync(key, jsonValue);
  }
};

export const getData = async (key) => {
  let jsonValue = null;
  if (Platform.OS === 'web') {
    try { jsonValue = localStorage.getItem(key); } catch (e) {}
  } else {
    jsonValue = await SecureStore.getItemAsync(key);
  }
  return jsonValue != null ? JSON.parse(jsonValue) : null;
};