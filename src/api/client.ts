/* src/api/client.ts */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getToken, removeToken, saveToken, getRefreshToken, saveRefreshToken, removeRefreshToken } from '../utils/storage';
import { API_CONFIG } from '../constants/config';

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedCallback = (cb: (() => void) | null) => {
  onUnauthorized = cb;
};

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
        if (!refreshPromise) {
          if (__DEV__) console.log('🔄 토큰 만료됨. 서버에 토큰 갱신을 요청합니다...');

          const currentRefreshToken = await getRefreshToken();
          if (!currentRefreshToken) throw new Error('No refresh token available');

          refreshPromise = axios
            .post(
              `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/refresh`,
              { refreshToken: currentRefreshToken },
              { headers: { Authorization: `Bearer ${currentRefreshToken}` } },
            )
            .then(async res => {
              const newAccessToken = res.data.accessToken;
              const newRefreshToken = res.data.refreshToken;
              if (!newAccessToken) throw new Error('No access token in refresh response');
              await saveToken(newAccessToken);
              if (newRefreshToken) await saveRefreshToken(newRefreshToken);
              return newAccessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        if (__DEV__) console.error('❌ 토큰 갱신 실패:', refreshError);
        await removeToken();
        await removeRefreshToken();
        onUnauthorized?.();
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
