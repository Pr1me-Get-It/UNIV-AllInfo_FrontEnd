import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getToken } from '../utils/storage';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  description?: string;
  type?: number; // 0: undergraduate, 1: graduate (custom field)
  displayText?: string[]; // Custom field for sliced text
}

export const fetchGoogleEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const storedToken = await getToken();
    if (!storedToken) return [];

    let accessToken = storedToken;
    try {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) accessToken = tokens.accessToken;
    } catch (e) {
      // Ignore if silent sign-in fails or no tokens
    }

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
