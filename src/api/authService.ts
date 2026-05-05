/* src/api/authService.ts */
import { api } from './client';

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
    return await api.post('/auth/google', { idToken });
  },

  /**
   * 구글과 마찬가지? 예정?
   * POST /auth/apple
   */
  loginWithApple: async (identityToken: string) => {
    return await api.post('/auth/apple', { identityToken });
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
