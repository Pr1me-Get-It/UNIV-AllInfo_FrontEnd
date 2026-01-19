//유저 등록, 푸시 토큰 동기화 등 API 함수

import { api } from './client';

export const registerUser = async (email, expoPushToken) => {
  return await api.post('/user/register', { email, expoPushToken });
};

// 키워드 조회 및 추가 (기존 방식 유지)
export const syncKeywords = async (email, keywords = []) => {
  return await api.post('/user/keyword', { email, keywords });
};

// 키워드 삭제
export const deleteUserKeyword = async (email, keyword) => {
  return await api.delete('/user/keyword', {
    data: { email, keywords: [keyword] }
  });
};