import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveData, getData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

// 1. 데이터 타입 정의
interface MockEvent {
  id: string;
  summary: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
}

interface AlarmProviderProps {
  children: React.ReactNode;
}

interface AlarmItem {
  id: string | number;
  title: string;
  image?: any;
  source?: string;
  date?: string;
  [key: string]: any;
}

interface AlarmContextType {
  readStatus: Record<string, boolean>;
  bookmarkStatus: Record<string, AlarmItem>;
  mockEvents: MockEvent[];
  markAsRead: (id: string | number, isRead?: boolean) => void;
  markMultipleAsRead: (ids: (string | number)[], isRead?: boolean) => void;
  toggleBookmark: (item: AlarmItem) => void;
  addMockEvent: (newEvent: MockEvent) => void;
}

const TODAY_STR = new Date().toISOString().split('T')[0];
const INITIAL_MOCK_EVENTS: MockEvent[] = [
  {
    id: 'dev-1',
    summary: '[개발] 캡스톤 디자인 미팅',
    location: 'IT-4호관',
    start: { dateTime: `${TODAY_STR}T10:00:00` },
  },
  {
    id: 'dev-2',
    summary: '[개발] 백엔드 API 연동 테스트',
    start: { date: TODAY_STR },
  },
];

export const AlarmContext = createContext<AlarmContextType>({
  readStatus: {},
  bookmarkStatus: {},
  mockEvents: [],
  markAsRead: () => { },
  markMultipleAsRead: () => { },
  toggleBookmark: () => { },
  addMockEvent: () => { },
});

// 🔒 SecureStore 키 안전화 함수: 특수문자(@ 등)를 언더바로 치환
const sanitizeKey = (email: string | null) => {
  if (!email) return 'guest'; // 비회원도 읽음 처리 로컬 저장 가능하도록 'guest' 키 사용
  return email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

export const AlarmProvider = ({ children }: AlarmProviderProps) => {
  const { userEmail } = useAuth();
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<string, AlarmItem>>({});
  const [mockEvents, setMockEvents] = useState<MockEvent[]>(INITIAL_MOCK_EVENTS);

  // 데이터 로드 로직 수정: 이메일 치환 적용
  const loadUserData = useCallback(async (email: string | null) => {
    const safeEmail = sanitizeKey(email);

    try {
      // 북마크는 로그인한 유저만 로드 (guest일 경우 빈 객체)
      const bookmarkKey = STORAGE_KEYS.BOOKMARK(safeEmail);
      const savedBookmarks = email ? await getData<Record<string, AlarmItem>>(bookmarkKey) : {};
      
      const readKey = STORAGE_KEYS.READ(safeEmail);
      const savedReads = await getData<Record<string, boolean>>(readKey);

      setBookmarkStatus(savedBookmarks || {});
      setReadStatus(savedReads || {});
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    }
  }, []);

  useEffect(() => {
    loadUserData(userEmail);
  }, [userEmail, loadUserData]);

  // 읽음 처리 로직 수정: 이메일 치환 적용
  const markAsRead = useCallback(
    (id: string | number, isRead: boolean = true) => {
      const safeEmail = sanitizeKey(userEmail);

      setReadStatus((prev: Record<string, boolean>) => {
        const newStatus = { ...prev, [String(id)]: isRead };
        saveData(STORAGE_KEYS.READ(safeEmail), newStatus);
        return newStatus;
      });
    },
    [userEmail],
  );

  const markMultipleAsRead = useCallback(
    (ids: (string | number)[], isRead: boolean = true) => {
      const safeEmail = sanitizeKey(userEmail);
      if (ids.length === 0) return;

      setReadStatus((prev: Record<string, boolean>) => {
        const newStatus = { ...prev };
        ids.forEach(id => {
          newStatus[String(id)] = isRead;
        });
        saveData(STORAGE_KEYS.READ(safeEmail), newStatus);
        return newStatus;
      });
    },
    [userEmail],
  );

  // 북마크 토글 로직 수정: 이메일 치환 적용
  const toggleBookmark = useCallback(
    (item: AlarmItem) => {
      if (!userEmail) return; // 비로그인: DetailScreen에서 CustomAlert로 처리됨
      const safeEmail = sanitizeKey(userEmail);

      setBookmarkStatus((prev: Record<string, AlarmItem>) => {
        const newStatus = { ...prev };
        const idKey = String(item.id);
        if (newStatus[idKey]) delete newStatus[idKey];
        else newStatus[idKey] = item;

        saveData(STORAGE_KEYS.BOOKMARK(safeEmail), newStatus);
        return newStatus;
      });
    },
    [userEmail],
  );

  const addMockEvent = useCallback((newEvent: MockEvent) => {
    setMockEvents((prev: MockEvent[]) => [...prev, newEvent]);
  }, []);

  return (
    <AlarmContext.Provider
      value={{
        readStatus,
        bookmarkStatus,
        mockEvents,
        markAsRead,
        markMultipleAsRead,
        toggleBookmark,
        addMockEvent,
      }}>
      {children}
    </AlarmContext.Provider>
  );
};
