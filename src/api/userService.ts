/* src/api/userService.ts */
import { api } from './client';
import { AxiosResponse } from 'axios';

// 1. API 응답 데이터 규격 정의
interface KeywordResponse {
  success: boolean;
  keywords: string[];
}

/**
 * 유저 등록 및 푸시 토큰 동기화
 * @param email 유저 이메일
 * @param expoPushToken 엑스포 푸시 토큰 (없을 수 있음)
 */
export const registerUser = async (
  email: string,
  expoPushToken: string | null
): Promise<AxiosResponse<any>> => {
  return await api.post('/user/register', { email, expoPushToken });
};

/**
 * 키워드 조회 및 추가
 * @param email 유저 이메일
 * @param keywords 추가할 키워드 배열 (기본값 빈 배열)
 */
export const syncKeywords = async (
  email: string,
  keywords: string[] = []
): Promise<AxiosResponse<KeywordResponse>> => {
  return await api.post('/user/keyword', { email, keywords });
};

/**
 * 키워드 조회 (덮어쓰기 방지용 GET)
 * @param email 유저 이메일
 */
export const getUserKeywords = async (
  email: string
): Promise<AxiosResponse<KeywordResponse>> => {
  return await api.get('/user/keyword', { params: { email } });
};

/**
 * 키워드 삭제
 * @param email 유저 이메일
 * @param keyword 삭제할 단일 키워드
 */
export const deleteUserKeyword = async (
  email: string,
  keyword: string
): Promise<AxiosResponse<KeywordResponse>> => {
  return await api.delete('/user/keyword', {
    data: { email, keywords: [keyword] }
  });
};