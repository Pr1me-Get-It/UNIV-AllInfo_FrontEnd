
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // 분리한 AuthContext 사용
import { saveData, getData } from '../utils/storage'; //
import { STORAGE_KEYS } from '../constants/storageKeys';

const TODAY_STR = new Date().toISOString().split('T')[0]; //
const INITIAL_MOCK_EVENTS = [ //
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

export const AlramContext = createContext({
    readStatus: {},
    bookmarkStatus: {},     
    mockEvents: [], 
    markAsRead: () => {}, 
    toggleBookmark: () => {},
    addMockEvent: () => {},
});

export const AlramProvider = ({ children }) => {
  // AuthContext로부터 현재 로그인된 유저의 이메일을 실시간으로 가져옵니다.
  const { userEmail } = useAuth(); 
  
  const [readStatus, setReadStatus] = useState({});
  const [bookmarkStatus, setBookmarkStatus] = useState({});
  const [mockEvents, setMockEvents] = useState(INITIAL_MOCK_EVENTS);

  // 저장 키 생성 유틸 (기존 로직 유지)
  const getSafeKey = (email, type) => {
    if (!email) return '';
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `${type}_${safeEmail}`;
  };

  // 특정 유저의 로컬 데이터를 로드하는 함수
  const loadUserData = useCallback(async (email) => {
  if (!email) return;
  try {
    // getSafeKey 함수 대신 상수의 헬퍼 함수 사용
    const bookmarkKey = STORAGE_KEYS.BOOKMARK(email);
    const readKey = STORAGE_KEYS.READ(email);

    const [savedBookmarks, savedReads] = await Promise.all([
      getData(bookmarkKey),
      getData(readKey)
    ]);
    // ... 이하 동일
  } catch (e) {
    console.error("데이터 로드 실패:", e);
  }
}, []);

  // 유저(userEmail)가 변경될 때마다(로그인/로그아웃/세션복구) 데이터를 새로 불러옵니다.
  useEffect(() => {
    loadUserData(userEmail);
  }, [userEmail, loadUserData]);

  // 알림 읽음 처리
  const markAsRead = useCallback((id, isRead = true) => {
    if (!userEmail) return; 
    setReadStatus(prev => {
      const newStatus = { ...prev, [id]: isRead };
      saveData(getSafeKey(userEmail, 'read'), newStatus);
      return newStatus;
    });
  }, [userEmail]);

  // 북마크 토글
  const toggleBookmark = useCallback((item) => {
    if (!userEmail) {
        alert("로그인이 필요합니다.");
        return;
    }
    setBookmarkStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[item.id]) delete newStatus[item.id]; 
      else newStatus[item.id] = item; 
      saveData(getSafeKey(userEmail, 'bookmark'), newStatus);
      return newStatus;
    });
  }, [userEmail]);

  // 목업 이벤트 추가
  const addMockEvent = useCallback((newEvent) => {
    setMockEvents(prev => [...prev, newEvent]);
  }, []);

  return (
    <AlramContext.Provider value={{ 
        readStatus, 
        bookmarkStatus,
        mockEvents, 
        markAsRead, 
        toggleBookmark,
        addMockEvent,
    }}>
      {children}
    </AlramContext.Provider>
  );
};