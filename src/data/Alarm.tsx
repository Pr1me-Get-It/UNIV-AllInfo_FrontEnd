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
  toggleBookmark: () => { },
  addMockEvent: () => { },
});

// 🔒 SecureStore 키 안전화 함수: AuthContext와 통일 (점(.)을 언더바(_)로 치환), 비로그인 시 'guest'
const sanitizeKey = (email: string | null) => {
  if (!email) return 'guest';
  return email.replace(/\./g, '_');
};

export const AlarmProvider = ({ children }: AlarmProviderProps) => {
  const { userEmail } = useAuth();
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<string, AlarmItem>>({});
  const [mockEvents, setMockEvents] = useState<MockEvent[]>(INITIAL_MOCK_EVENTS);

  // 데이터 로드 로직 수정: 이메일 치환 적용
  const loadUserData = useCallback(async (email: string | null) => {
    const safeEmail = sanitizeKey(email);
    // guest도 로딩 진행
    try {
      const bookmarkKey = STORAGE_KEYS.BOOKMARK(safeEmail);
      const readKey = STORAGE_KEYS.READ(safeEmail);

      const [savedBookmarks, savedReads] = await Promise.all([
        getData<Record<string, AlarmItem>>(bookmarkKey),
        getData<Record<string, boolean>>(readKey),
      ]);
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
        // 비동기 스토리지 저장을 setState 콜백에서 분리 (데이터 유실 방지)
        setTimeout(() => {
          saveData(STORAGE_KEYS.READ(safeEmail), newStatus);
        }, 0);
        return newStatus;
      });
    },
    [userEmail],
  );

  // 북마크 토글 로직 수정: 이메일 치환 적용
  const toggleBookmark = useCallback(
    (item: AlarmItem) => {
      const safeEmail = sanitizeKey(userEmail);
      if (safeEmail === 'guest') return; // 비로그인: DetailScreen에서 CustomAlert로 처리됨

      setBookmarkStatus((prev: Record<string, AlarmItem>) => {
        const newStatus = { ...prev };
        const idKey = String(item.id);
        if (newStatus[idKey]) delete newStatus[idKey];
        else newStatus[idKey] = item;

        // 비동기 스토리지 저장을 setState 콜백에서 분리
        setTimeout(() => {
          saveData(STORAGE_KEYS.BOOKMARK(safeEmail), newStatus);
        }, 0);
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
        toggleBookmark,
        addMockEvent,
      }}>
      {children}
    </AlarmContext.Provider>
  );
};
