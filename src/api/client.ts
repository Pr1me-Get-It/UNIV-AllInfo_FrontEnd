/* src/api/client.ts */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getToken, removeToken, saveToken } from '../utils/storage';
import { API_CONFIG } from '../constants/config';

// 1. 커스텀 요청 설정을 위한 인터페이스 확장
// 기존 AxiosRequestConfig에는 없는 _retry 속성을 추가합니다.
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// [요청 인터셉터]
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// [응답 인터셉터]
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // error.config를 CustomRequestConfig로 타입 단언(Type Assertion)
    const originalRequest = error.config as CustomRequestConfig;

    // 401 에러(인증 만료) 발생 시 1회에 한해 토큰 갱신 시도
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (__DEV__) console.log('🔄 토큰 만료됨. 자동으로 갱신을 시도합니다...');

        // 1. 구글 Silent Sign-in으로 세션 갱신
        await GoogleSignin.signInSilently();
        const tokens = await GoogleSignin.getTokens();
        const accessToken = tokens.accessToken;

        if (accessToken) {
          // 2. 새 토큰 저장 및 헤더 업데이트
          await saveToken(accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // 3. 원래 하려던 요청 재시도
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 갱신 실패 시 로그아웃 처리
        if (__DEV__) console.error('❌ 토큰 갱신 실패:', refreshError);
        await removeToken();
        Alert.alert('알림', '세션이 만료되었습니다. 다시 로그인해 주세요.');
      }
    }

    // 서버 오류 처리 (500번대)
    // 단, /gamescore/best 엔드포인트는 점수 없음(500)을 0점으로 처리하므로 알림 제외
    const isGameScoreBest = originalRequest.url?.includes('/gamescore/best');

    if (error.response?.status && error.response.status >= 500 && !isGameScoreBest) {
      Alert.alert('서버 오류', '서버와의 연결이 원활하지 않습니다.');
    }

    return Promise.reject(error);
  },
);
