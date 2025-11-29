import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'user_access_token';
const USER_INFO_KEY = 'user_info';
const LIKED_NOTICES_KEY = 'user_liked_notices';

// 토큰 저장
export const saveToken = async (token) => {
  // 🚨 [수정] 토큰이 없으면 저장하지 않음 (에러 방지)
  if (!token) return;

  // 만약 토큰이 객체라면 문자열로 변환
  const tokenToSave = typeof token === 'string' ? token : JSON.stringify(token);

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(TOKEN_KEY, tokenToSave);
    } catch (e) {
      console.error("Local storage error:", e);
    }
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, tokenToSave);
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
  if (!value) return; // null 방지
  const jsonValue = JSON.stringify(value);
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, jsonValue); } catch (e) {}
  } else {
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