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
  pushedNoticeIds: string[];
  markAsRead: (id: string | number, isRead?: boolean) => void;
  markMultipleAsRead: (ids: (string | number)[], isRead?: boolean) => void;
  toggleBookmark: (item: AlarmItem) => void;
  addMockEvent: (newEvent: MockEvent) => void;
  clearPushedNotices: () => void;
  removePushedNotice: (id: string) => void;
  addPushedNotice: (id: string) => void;
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
  markAsRead: () => {},
  markMultipleAsRead: () => {},
  toggleBookmark: () => {},
  addMockEvent: () => {},
  clearPushedNotices: () => {},
  removePushedNotice: () => {},
  addPushedNotice: () => {},
});

const resolveKey = (uid: string | null) => uid ?? 'guest';

export const AlarmProvider = ({ children }: AlarmProviderProps) => {
  // useAuth() 대신 useContext를 직접 사용: useAuth()는 Provider 미구성 시 throw하므로
  // Fast Refresh 또는 즉시 발송 알림 수신 타이밍에 안전하게 처리하기 위함
  const authContext = useContext(AuthContext);
  const userId = authContext?.userId ?? null;
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [bookmarkStatus, setBookmarkStatus] = useState<Record<string, AlarmItem>>({});
  const [mockEvents, setMockEvents] = useState<MockEvent[]>(INITIAL_MOCK_EVENTS);
  const [pushedNoticeIds, setPushedNoticeIds] = useState<string[]>([]);

  // 데이터 로드 로직 수정: 이메일 치환 적용
  const loadUserData = useCallback(async (uid: string | null) => {
    const key = resolveKey(uid);

    try {
      const savedBookmarks = uid
        ? await getData<Record<string, AlarmItem>>(STORAGE_KEYS.BOOKMARK(key))
        : {};
      const savedReads = await getData<Record<string, boolean>>(STORAGE_KEYS.READ(key));
      const savedPushedIds = await getData<string[]>(STORAGE_KEYS.PUSHED_NOTICES(key));

      setBookmarkStatus(savedBookmarks || {});
      setReadStatus(savedReads || {});
      setPushedNoticeIds(savedPushedIds || []);
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    }
  }, []);

  useEffect(() => {
    loadUserData(userId);
  }, [userId, loadUserData]);

  // 푸시 알림 수신 리스너: AlarmProvider 내부에서 등록하여 Context에 접근 가능하도록 처리
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) console.log('🔔 [AlarmContext] 포그라운드 알림 수신:', notification);

      // 백엔드는 noticeIds(배열)로 전송
      const raw = notification.request.content.data?.noticeIds
        ?? notification.request.content.data?.noticeId
        ?? notification.request.content.data?.notice_id;
      const ids: string[] = Array.isArray(raw)
        ? raw.map(String)
        : raw ? [String(raw)] : [];

      if (ids.length > 0) {
        const key = resolveKey(userId);
        setPushedNoticeIds(prev => {
          const next = [...prev, ...ids.filter(id => !prev.includes(id))];
          if (next.length !== prev.length) saveData(STORAGE_KEYS.PUSHED_NOTICES(key), next);
          return next;
        });
      }
    });

    return () => subscription.remove();
  }, [userId]);

  const markAsRead = useCallback(
    (id: string | number, isRead: boolean = true) => {
      const key = resolveKey(userId);
      const strId = String(id);
      setReadStatus((prev: Record<string, boolean>) => {
        const newStatus = { ...prev, [strId]: isRead };
        saveData(STORAGE_KEYS.READ(key), newStatus);
        return newStatus;
      });
    },
    [userId],
  );

  const markMultipleAsRead = useCallback(
    (ids: (string | number)[], isRead: boolean = true) => {
      const key = resolveKey(userId);
      if (ids.length === 0) return;
      const strIds = ids.map(i => String(i));
      setReadStatus((prev: Record<string, boolean>) => {
        const newStatus = { ...prev };
        strIds.forEach(id => { newStatus[id] = isRead; });
        saveData(STORAGE_KEYS.READ(key), newStatus);
        return newStatus;
      });
    },
    [userId],
  );

  const clearPushedNotices = useCallback(() => {
    const key = resolveKey(userId);
    setPushedNoticeIds([]);
    saveData(STORAGE_KEYS.PUSHED_NOTICES(key), []);
  }, [userId]);

  const addPushedNotice = useCallback((id: string) => {
    const key = resolveKey(userId);
    setPushedNoticeIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveData(STORAGE_KEYS.PUSHED_NOTICES(key), next);
      return next;
    });
  }, [userId]);

  const removePushedNotice = useCallback((id: string) => {
    const key = resolveKey(userId);
    setPushedNoticeIds(prev => {
      const next = prev.filter(i => i !== id);
      saveData(STORAGE_KEYS.PUSHED_NOTICES(key), next);
      return next;
    });
  }, [userId]);

  const toggleBookmark = useCallback(
    (item: AlarmItem) => {
      if (!userId) return;
      const key = resolveKey(userId);

      setBookmarkStatus((prev: Record<string, AlarmItem>) => {
        const newStatus = { ...prev };
        const idKey = String(item.id);
        if (newStatus[idKey]) delete newStatus[idKey];
        else newStatus[idKey] = item;

        saveData(STORAGE_KEYS.BOOKMARK(key), newStatus);
        return newStatus;
      });
    },
    [userId],
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
        clearPushedNotices,
        removePushedNotice,
        addPushedNotice,
      }}>
      {children}
    </AlarmContext.Provider>
  );
};
