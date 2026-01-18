/* src/constants/storageKeys.js */
export const STORAGE_KEYS = {
  TOKEN: 'user_access_token',
  USER_INFO: 'user_info',
  LIKED_NOTICES: 'user_liked_notices',
  // 동적 키 생성을 위한 헬퍼 함수
  BOOKMARK: (safeEmail) => `bookmark_${safeEmail}`,
  READ: (safeEmail) => `read_${safeEmail}`,
};