/* src/constants/storageKeys.js */
export const STORAGE_KEYS = {
  // 고정 키
  TOKEN: 'user_access_token',
  USER_INFO: 'user_info',
  LIKED_NOTICES: 'user_liked_notices',

  // 사용자별 동적 키 생성을 위한 헬퍼 함수
  BOOKMARK: (email) => {
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `bookmark_${safeEmail}`;
  },
  READ: (email) => {
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `read_${safeEmail}`;
  }
};