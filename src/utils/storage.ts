import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * 토큰 저장
 * @param token - 저장할 토큰 (문자열 또는 객체)
 */
export const saveToken = async (token: string | object): Promise<void> => {
  if (!token) return;
  const tokenToSave = typeof token === 'string' ? token : JSON.stringify(token);

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, tokenToSave);
    } catch (e) {
      console.error("Local storage error:", e);
    }
  } else {
    await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, tokenToSave);
  }
};

/**
 * 토큰 가져오기
 * @returns 저장된 토큰 문자열 또는 null
 */
export const getToken = async (): Promise<string | null> => {
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

/**
 * 토큰 삭제 (로그아웃)
 */
export const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (e) {}
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
  }
};

/**
 * [일반 저장소] 데이터 저장 (공지사항 캐시 등) - AsyncStorage로 변경
 */
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  if (value === undefined || value === null) return;
  const jsonValue = JSON.stringify(value);

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error("Save data error:", e);
    }
  } else {
    try {
      // 대용량 데이터 캐싱을 위해 AsyncStorage 사용
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error("AsyncStorage save error:", e);
    }
  }
};

/**
 * [일반 저장소] 데이터 가져오기 - AsyncStorage로 변경
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  if (!key || key.trim() === "") {
    console.warn("⚠️ [Storage] 빈 키가 전달되어 조회를 중단합니다.");
    return null;
  }

  try {
    let result: string | null;
    if (Platform.OS === 'web') {
      result = localStorage.getItem(key);
    } else {
      // AsyncStorage에서 데이터 조회
      result = await AsyncStorage.getItem(key);
    }
    
    return result ? JSON.parse(result) : null;
  } catch (e) {
    console.error("Get data error:", e);
    return null;
  }
};

/**
 * [일반 저장소] 특정 키의 데이터 삭제
 */
export const removeData = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  } else {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("AsyncStorage remove error:", e);
    }
  }
};