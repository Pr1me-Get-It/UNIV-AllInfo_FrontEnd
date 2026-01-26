/* src/constants/config.js */
export const API_CONFIG = {
  TIMEOUT: 8000,
  // 배포 환경에 따라 BASE_URL을 여기서 조건부 관리할 수도 있습니다.
};

export const AUTH_CONFIG = {
  DEV_TOKEN: "DEV_MODE_ACCESS_TOKEN",
  DEV_EMAIL: "test@knu.ac.kr",
  SCOPES: [
    'profile', 
    'email', 
    'https://www.googleapis.com/auth/calendar.events'
  ],
};