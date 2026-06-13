import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import { AuthContext } from '../context/AuthContext';
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
  pushedNoticeIds: string[];  // 푸시 알림으로 수신된 공지 ID 목록
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
  pushedNoticeIds: [],
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
  // useAuth() 대신 useContext를 직접 사용: useAuth()는 Provider 미구성 시 throw하므로
  // Fast Refresh 또는 즉시 발송 알림 수신 타이밍에 안전하게 처리하기 위함
  const authContext = useContext(AuthContext);
  const userEmail = authContext?.userEmail ?? null;
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<string, AlarmItem>>({});
  const [mockEvents, setMockEvents] = useState<MockEvent[]>(INITIAL_MOCK_EVENTS);
  const [pushedNoticeIds, setPushedNoticeIds] = useState<string[]>([]);

  // 데이터 로드 로직 수정: 이메일 치환 적용
  const loadUserData = useCallback(async (email: string | null) => {
    const safeEmail = sanitizeKey(email);

    try {
      // 북마크는 로그인한 유저만 로드 (guest일 경우 빈 객체)
      const bookmarkKey = STORAGE_KEYS.BOOKMARK(safeEmail);
      const savedBookmarks = email ? await getData<Record<string, AlarmItem>>(bookmarkKey) : {};

      const readKey = STORAGE_KEYS.READ(safeEmail);
      const savedReads = await getData<Record<string, boolean>>(readKey);

      // 푸시 알림으로 수신된 공지 ID 목록 로드
      const pushedKey = STORAGE_KEYS.PUSHED_NOTICES(safeEmail);
      const savedPushedIds = await getData<string[]>(pushedKey);

      setBookmarkStatus(savedBookmarks || {});
      setReadStatus(savedReads || {});
      setPushedNoticeIds(savedPushedIds || []);
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    }
  }, []);

  useEffect(() => {
    loadUserData(userEmail);
  }, [userEmail, loadUserData]);

  // 푸시 알림 수신 리스너: AlarmProvider 내부에서 등록하여 Context에 접근 가능하도록 처리
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('🔔 [AlarmContext] 포그라운드 알림 수신:', notification);

      const noticeId =
        notification.request.content.data?.noticeId ||
        notification.request.content.data?.notice_id;

      if (noticeId) {
        const id = String(noticeId);
        const safeEmail = sanitizeKey(userEmail);

        setPushedNoticeIds(prev => {
          if (prev.includes(id)) return prev; // 중복 방지
          const next = [...prev, id];
          saveData(STORAGE_KEYS.PUSHED_NOTICES(safeEmail), next);
          return next;
        });
      }
    });

    return () => subscription.remove();
  }, [userEmail]);

  // 읽음 처리 로직: 읽으면 pushedNoticeIds에서도 제거
  const markAsRead = useCallback(
    (id: string | number, isRead: boolean = true) => {
      const safeEmail = sanitizeKey(userEmail);
      const strId = String(id);

      setReadStatus((prev: Record<string, boolean>) => {
        const newStatus = { ...prev, [strId]: isRead };
        saveData(STORAGE_KEYS.READ(safeEmail), newStatus);
        return newStatus;
      });

      // 읽음 처리 시 푸시 알림 목록에서 제거
      if (isRead) {
        setPushedNoticeIds(prev => {
          if (!prev.includes(strId)) return prev;
          const next = prev.filter(i => i !== strId);
          saveData(STORAGE_KEYS.PUSHED_NOTICES(safeEmail), next);
          return next;
        });
      }
    },
    [userEmail],
  );

  const markMultipleAsRead = useCallback(
    (ids: (string | number)[], isRead: boolean = true) => {
      const safeEmail = sanitizeKey(userEmail);
      if (ids.length === 0) return;

      const strIds = ids.map(i => String(i));

      setReadStatus((prev: Record<string, boolean>) => {
        const newStatus = { ...prev };
        strIds.forEach(id => {
          newStatus[id] = isRead;
        });
        saveData(STORAGE_KEYS.READ(safeEmail), newStatus);
        return newStatus;
      });

      // 일괄 읽음 처리 시 푸시 알림 목록에서도 제거
      if (isRead) {
        setPushedNoticeIds(prev => {
          const next = prev.filter(i => !strIds.includes(i));
          if (next.length !== prev.length) {
            saveData(STORAGE_KEYS.PUSHED_NOTICES(safeEmail), next);
          }
          return next;
        });
      }
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
        pushedNoticeIds,
        markAsRead,
        markMultipleAsRead,
        toggleBookmark,
        addMockEvent,
      }}>
      {children}
    </AlarmContext.Provider>
  );
};
