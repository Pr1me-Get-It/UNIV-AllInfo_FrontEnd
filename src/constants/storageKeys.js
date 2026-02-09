/* src/constants/storageKeys.js */
export const STORAGE_KEYS = {
  TOKEN: 'user_access_token',
  USER_INFO: 'user_info',
  LIKED_NOTICES: 'user_liked_notices',
  // 동적 키 생성을 위한 헬퍼 함수
  BOOKMARK: safeEmail => `bookmark_${safeEmail}`,
  READ: safeEmail => `read_${safeEmail}`,
  KEYWORDS: safeEmail => `keywords_${safeEmail}`,
  NOTICE_CACHE: 'notice_monthly_cache',
  NOTICE_CACHE_TIME: 'notice_cache_timestamp',
  PUSH_SETTING: safeEmail => `push_setting_${safeEmail}`,
  MAP_FILTER: safeEmail => `map_filter_${safeEmail}`,
  NICKNAME: safeEmail => `nickname_${safeEmail}`,
  FILTER_MODE: safeEmail => `cal_filter_${safeEmail}`,
};
