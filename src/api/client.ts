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
        if (__DEV__) console.log('🔄 토큰 만료됨. 서버에 토큰 갱신을 요청합니다...');

        // TODO: (1) 저장소에 저장해둔 refreshToken을 가져옵니다.
        // const currentRefreshToken = await getRefreshToken(); 
        
        // TODO: (2) /auth/refresh 호출로 새 토큰 발급
        // 순환 참조 방지를 위해 api 인스턴스 대신 axios를 직접 사용하는 것을 권장합니다.
        /*
        const refreshResponse = await axios.post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/refresh`,
          { refreshToken: currentRefreshToken } // 실제 백엔드 요구 스펙에 맞게 넣으세요
        );
        const newAccessToken = refreshResponse.data.accessToken;
        // const newRefreshToken = refreshResponse.data.refreshToken;
        */

        // 임시 테스트용 가짜 변수 (실제로 위 코드를 사용할 때 지우세요)
        const newAccessToken = "TEMPORARY_NEW_ACCESS_TOKEN";

        if (newAccessToken) {
          // (3) 새 토큰 저장 및 헤더 업데이트
          await saveToken(newAccessToken);
          // await saveRefreshToken(newRefreshToken); // 리프레시 토큰도 새로 오면 저장

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // (4) 실패했던 원래 요청을 새 토큰으로 재시도
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 갱신 실패 시 로그아웃 처리
        if (__DEV__) console.error('❌ 토큰 갱신 실패:', refreshError);
        await removeToken();
        // await removeRefreshToken(); // 리프레시 토큰도 같이 삭제
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
