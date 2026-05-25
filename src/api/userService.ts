/* src/api/userService.ts */
import { api } from './client';

export interface UserInfo {
  id: string;
  email: string;
  provider: 'GOOGLE' | 'APPLE';
  provider_id: string;
}

export interface UserProfile {
  user_id: string;
  nickname: string;
  college: string;
  department: string;
}

export interface UpdateProfileData {
  nickname?: string;
  college?: string;
  department?: string;
}

export const userService = {
  /**
   * email, auth 정보 등 가져오기
   * GET /users/me
   */
  getMyInfo: async () => {
    return await api.get('/users/me');
  },

  /**
   * 닉네임, 단과대 등 내 프로필 가져오기
   * GET /users/me/profile
   */
  getMyProfile: async () => {
    return await api.get('/users/me/profile');
  },

  /**
   * 프로필 수정 및 저장
   * PATCH /users/me/profile
   */
  updateMyProfile: async (profileData: UpdateProfileData) => {
    return await api.patch('/users/me/profile', profileData);
  },

  /**
   * 다른 사람 프로필 가져오기
   * GET /users/:userId/profile
   */
  getUserProfile: async (userId: string | number) => {
    return await api.get(`/users/${userId}/profile`);
  },
};

// ============================================================================
// 아래는 기존에 있던 API들입니다.
// 백엔드의 새로운 키워드 관련 명세가 확정되면 새 엔드포인트로 변경하시거나 지우시면 됩니다.
// ============================================================================
/*
interface KeywordResponse {
  success: boolean;
  keywords: string[];
}

export const registerUser = async (email: string, expoPushToken: string | null) => {
  return await api.post('/user/register', { email, expoPushToken });
};

export const syncKeywords = async (email: string, keywords: string[] = []) => {
  return await api.post('/user/keyword', { email, keywords });
};

export const getUserKeywords = async (email: string) => {
  return await api.get('/user/keyword', { params: { email } });
};

export const deleteUserKeyword = async (email: string, keyword: string) => {
  return await api.delete('/user/keyword', { data: { email, keywords: [keyword] } });
};

export const withdrawUser = async (email: string) => {
  // -> 새 명세에서는 /auth/withdraw 로 변경됨 (authService로 이동)
};
*/
