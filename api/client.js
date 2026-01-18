/* src/api/client.js */
import axios from 'axios';
import { Alert } from 'react-native';
import { getToken, removeToken } from '../utils/storage';
import { API_CONFIG } from '../constants/config';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT, // constants/config.js의 설정값 사용
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const { response } = error;

    if (response) {
      if (response.status === 401) {
        console.warn("🔐 세션이 만료되었습니다. 로그아웃 처리합니다.");
        await removeToken();
        Alert.alert("알림", "세션이 만료되어 로그아웃되었습니다. 다시 로그인해 주세요.");
      } 
      
      else if (response.status >= 500) {
        Alert.alert("서버 오류", "서버 서버와의 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.");
      }
      else {
        console.error(`API 에러 (${response.status}):`, response.data);
      }
    } else {
      Alert.alert("연결 오류", "네트워크 연결 상태를 확인하거나 잠시 후 다시 시도해 주세요.");
    }

    return Promise.reject(error);
  }
);