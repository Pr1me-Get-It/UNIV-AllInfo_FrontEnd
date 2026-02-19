/* src/constants/storageKeys.ts */
export const STORAGE_KEYS = {
    TOKEN: 'user_access_token',
    USER_INFO: 'user_info',
    LIKED_NOTICES: 'user_liked_notices',
    // 동적 키 생성을 위한 헬퍼 함수
    BOOKMARK: (safeEmail: string) => `bookmark_${safeEmail}`,
    READ: (safeEmail: string) => `read_${safeEmail}`,
    KEYWORDS: (safeEmail: string) => `keywords_${safeEmail}`,
    NOTICE_CACHE: 'notice_monthly_cache',
    NOTICE_CACHE_TIME: 'notice_cache_timestamp',
    PUSH_SETTING: (safeEmail: string) => `push_setting_${safeEmail}`,
    MAP_FILTER: (safeEmail: string) => `map_filter_${safeEmail}`,
    NICKNAME: (safeEmail: string) => `nickname_${safeEmail}`,
    FILTER_MODE: (safeEmail: string) => `cal_filter_${safeEmail}`,
    FILTER_SETTINGS: 'filter_settings',
    GAME_SCORES: (safeEmail: string) => `game_scores_${safeEmail}`, // Added for local game score management
};
