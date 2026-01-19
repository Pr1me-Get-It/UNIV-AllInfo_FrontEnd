import * as SecureStore from 'expo-secure-store';
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
 * 일반 데이터 저장 (객체/배열 등)
 * @param key - 저장할 키
 * @param value - 저장할 값 (자동으로 JSON 직렬화됨)
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
    await SecureStore.setItemAsync(key, jsonValue);
  }
};

/**
 * 일반 데이터 가져오기
 * @param key - 가져올 키
 * @returns 파싱된 데이터 객체 또는 null
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    let result: string | null;
    if (Platform.OS === 'web') {
      result = localStorage.getItem(key);
    } else {
      result = await SecureStore.getItemAsync(key);
    }

    if (result) {
      return JSON.parse(result) as T;
    }
    return null;
  } catch (e) {
    console.error("Get data error:", e);
    return null;
  }
};

/**
 * 특정 키의 데이터 삭제
 * @param key - 삭제할 키
 */
export const removeData = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};