/* src/constants/storageKeys.ts */

// 1. 읽기 전용 속성을 보장하기 위해 'as const'를 사용합니다.
export const STORAGE_KEYS = {
  // 고정 키 (정적 키)
  TOKEN: 'user_access_token' as const,
  USER_INFO: 'user_info' as const,
  LIKED_NOTICES: 'user_liked_notices' as const,
  FILTER_SETTINGS: 'filter_settings' as const,

  /**
   * 사용자별 동적 키 생성을 위한 헬퍼 함수
   * @param email 유저의 이메일 주소
   * @returns 안전하게 인코딩된 스토리지 키 문자열
   */
  BOOKMARK: (email: string): string => {
    // 특수문자를 제거하여 스토리지 시스템(특히 Web LocalStorage)과의 호환성을 높입니다.
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `bookmark_${safeEmail}`;
  },

  READ: (email: string): string => {
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `read_${safeEmail}`;
  },
} as const;

// 2. 다른 파일에서 이 구조를 타입으로 참조할 수 있도록 내보냅니다.
export type StorageKeysType = typeof STORAGE_KEYS;
