/* src/constants/storageKeys.js */
export const STORAGE_KEYS = {
  TOKEN: 'user_access_token',
  REFRESH_TOKEN: 'user_refresh_token',
  GOOGLE_ACCESS_TOKEN: 'google_access_token',
  USER_INFO: 'user_info',
  LIKED_NOTICES: 'user_liked_notices',
  // 동적 키 생성을 위한 헬퍼 함수 (userId 기반)
  BOOKMARK: userId => `bookmark_${userId}`,
  READ: userId => `read_${userId}`,
  KEYWORDS: userId => `keywords_${userId}`,
  ACADEMIC_SOURCES: userId => `academic_sources_${userId}`,
  NOTICE_CACHE: 'notice_monthly_cache',
  NOTICE_CACHE_TIME: 'notice_cache_timestamp',
  PUSH_SETTING: userId => `push_setting_${userId}`,
  MAP_FILTER: userId => `map_filter_${userId}`,
  NICKNAME: userId => `nickname_${userId}`,
  FILTER_MODE: userId => `cal_filter_${userId}`,
  GAME_SCORES: userId => `game_scores_${userId}`,
  PUSHED_NOTICES: userId => `pushed_notices_${userId}`,
};
