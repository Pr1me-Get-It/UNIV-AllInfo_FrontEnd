/* src/api/authService.ts */
//인증(Authentication) API 통신 담당 레이어: 
//소셜 로그인(구글, 애플), 
//세션 유지(토큰 재발급), 
//회원 탈퇴 등 사용자의 계정 인증 및 
//토큰 세션 관리를 백엔드 서버(EXPO_PUBLIC_API_BASE_URL)와 동기화하기 위한 통신 로직을 모아둔 모듈

import { api } from './client';
import axios from 'axios';

// TODO: 응답 및 요청 데이터 타입은 백엔드 명세서에 맞게 상세히 정의하세요.
export interface AuthResponse {
  // 예: accessToken: string;
  // refreshToken: string;
}

export const authService = {
  /**
   * test용 (Hello World 응답)
   * GET /
   */
  testApi: async () => {
    return await api.get('/');
  },

  /**
   * 클라이언트에서 SDK로 로그인 후 받은 id_token 백으로 넘겨서 검증
   * POST /auth/google
   */
  loginWithGoogle: async (idToken: string) => {
    return await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/google`, { idToken });
  },

  /**
   * 구글과 마찬가지? 예정?
   * POST /auth/apple
   */
  loginWithApple: async (idToken: string, authorizationCode?: string | null) => {
    const payload = {
      idToken,
      ...(authorizationCode != null ? { authorizationCode } : {}),
    };

    return await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/apple`, payload);
  },

  /**
   * RTR을 위한 Access Token, Refresh Token 재발급
   * POST /auth/refresh
   */
  refreshToken: async (refreshToken: string) => {
    return await api.post('/auth/refresh', { refreshToken });
  },

  /**
   * DB에서 유저 삭제
   * DELETE /auth/withdraw
   */
  withdrawUser: async () => {
    return await api.delete('/auth/withdraw');
  },
};
