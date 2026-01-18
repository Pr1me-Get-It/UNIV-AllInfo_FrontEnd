//유저 등록, 푸시 토큰 동기화 등 API 함수

import { api } from './client';

export const registerUser = async (email, expoPushToken) => {
  return await api.post('/user/register', { email, expoPushToken });
};