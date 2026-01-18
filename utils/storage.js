import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants/storageKeys';

const TOKEN_KEY = 'user_access_token';
const USER_INFO_KEY = 'user_info';
const LIKED_NOTICES_KEY = 'user_liked_notices';

// 토큰 저장
export const saveToken = async (token) => {
  if (!token) return;
  const tokenToSave = typeof token === 'string' ? token : JSON.stringify(token);

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, tokenToSave); // 상수 사용
    } catch (e) {
      console.error("Local storage error:", e);
    }
  } else {
    await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, tokenToSave); // 상수 사용
  }
};
// 토큰 가져오기
export const getToken = async () => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (e) {
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
  }
};

// 토큰 삭제 (로그아웃)
export const removeToken = async () => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (e) {}
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
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