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
