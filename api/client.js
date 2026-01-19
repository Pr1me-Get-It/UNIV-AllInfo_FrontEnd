/* src/api/client.js */
import axios from 'axios';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin'; 
import { getToken, removeToken, saveToken } from '../utils/storage'; 
import { API_CONFIG } from '../constants/config';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
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
  (error) => Promise.reject(error)
);

// [응답 인터셉터] 토큰 갱신 로직 추가
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러(인증 만료) 발생 시 1회에 한해 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log(" 토큰 만료됨. 자동으로 갱신을 시도합니다...");
        
        // 1. 구글 Silent Sign-in으로 세션 갱신
        await GoogleSignin.signInSilently();
        const { accessToken } = await GoogleSignin.getTokens();

        if (accessToken) {
          // 2. 새 토큰 저장 및 헤더 업데이트
          await saveToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // 3. 원래 하려던 요청 재시도
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 갱신 실패 시 로그아웃 처리
        console.error(" 토큰 갱신 실패:", refreshError);
        await removeToken();
        Alert.alert("알림", "세션이 만료되었습니다. 다시 로그인해 주세요.");
      }
    }

    // 그 외 에러 처리 (기존 로직 유지)
    if (error.response?.status >= 500) {
      Alert.alert("서버 오류", "서버와의 연결이 원활하지 않습니다.");
    }
    return Promise.reject(error);
  }
);