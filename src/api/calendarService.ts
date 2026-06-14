import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  description?: string;
  type?: number;
  displayText?: string[];
}

export const fetchGoogleEvents = async (): Promise<CalendarEvent[]> => {
  try {
    // 구글 accessToken은 백엔드 JWT와 별도 키로 관리
    let accessToken = await getData<string>(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);

    // 저장된 토큰이 없거나 만료됐을 경우 GoogleSignin에서 fresh 토큰 취득
    try {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) {
        accessToken = tokens.accessToken;
        await import('../utils/storage').then(({ saveData }) =>
          saveData(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, tokens.accessToken),
        );
      }
    } catch (e) {
      // 구글 세션 없음 (애플 로그인 유저 등) — 저장된 토큰으로 시도
    }

    if (!accessToken) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const timeMin = new Date(`${currentYear - 1}-01-01T00:00:00Z`).toISOString();
    const timeMax = new Date(`${currentYear + 1}-12-31T23:59:59Z`).toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&orderBy=startTime&singleEvents=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (response.ok) {
      const data = await response.json();
      return data.items || [];
    }
  } catch (e) {
    console.error('Google Calendar API Error:', e);
  }
  return [];
};
