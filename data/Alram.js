import React, { createContext, useState, useCallback, useEffect } from 'react';
import { getToken, saveData, getData } from '../utils/storage';

// 초기 가짜 데이터
const TODAY_STR = new Date().toISOString().split('T')[0];
const INITIAL_MOCK_EVENTS = [
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

const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_EMAIL = "test@knu.ac.kr";

export const AlramContext = createContext({
    userEmail: null,
    readStatus: {},
    bookmarkStatus: {},     
    mockEvents: [], 
    markAsRead: () => {}, 
    toggleBookmark: () => {},
    addMockEvent: () => {},
    loginUser: () => {}, // 로그인 시 호출
    logoutUser: () => {}, // 로그아웃 시 호출
});

export const AlramProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [readStatus, setReadStatus] = useState({});
  const [bookmarkStatus, setBookmarkStatus] = useState({});
  const [mockEvents, setMockEvents] = useState(INITIAL_MOCK_EVENTS);

  // 이메일을 저장소 키로 변환 (특수문자 제거)
  const getSafeKey = (email, type) => {
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `${type}_${safeEmail}`;
  };

  // 📂 사용자 데이터 불러오기 (북마크, 읽음 상태)
  const loadUserData = async (email) => {
    if (!email) return;
    try {
        const bookmarkKey = getSafeKey(email, 'bookmark');
        const readKey = getSafeKey(email, 'read');

        const [savedBookmarks, savedReads] = await Promise.all([
            getData(bookmarkKey),
            getData(readKey)
        ]);

        if (savedBookmarks) setBookmarkStatus(savedBookmarks);
        else setBookmarkStatus({});

        if (savedReads) setReadStatus(savedReads);
        else setReadStatus({});

        console.log(`📂 [Alram] ${email} 데이터 로드 완료`);
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
  };

  // 👤 로그인 액션
  const loginUser = useCallback(async (email) => {
    console.log(`👤 [Alram] 로그인 처리: ${email}`);
    setUserEmail(email);
    await loadUserData(email);
  }, []);

  // 👋 로그아웃 액션
  const logoutUser = useCallback(() => {
    console.log("👋 [Alram] 로그아웃");
    setUserEmail(null);
    setBookmarkStatus({});
    setReadStatus({});
  }, []);

  // 앱 시작 시 자동 로그인 체크
  useEffect(() => {
    const init = async () => {
      const token = await getToken();
      if (token) {
        if (token === DEV_TOKEN) {
            loginUser(DEV_EMAIL);
            return;
        }
        try {
          const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const userInfo = await res.json();
            loginUser(userInfo.email);
          }
        } catch (e) {
           console.error("자동 로그인 실패:", e);
        }
      }
    };
    init();
  }, [loginUser]);

  // 📖 읽음 처리 (로컬 저장)
  const markAsRead = useCallback((id, isRead = true) => {
    if (!userEmail) return; // 비로그인 시 저장 안 함 (옵션)
    
    setReadStatus(prev => {
      const newStatus = { ...prev, [id]: isRead };
      saveData(getSafeKey(userEmail, 'read'), newStatus);
      return newStatus;
    });
  }, [userEmail]);

  // ⭐ 북마크 토글 (로컬 저장)
  const toggleBookmark = useCallback((item) => {
    if (!userEmail) {
        alert("로그인이 필요합니다.");
        return;
    }

    setBookmarkStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[item.id]) {
        delete newStatus[item.id]; // 삭제
      } else {
        newStatus[item.id] = item; // 추가
      }
      // 저장
      saveData(getSafeKey(userEmail, 'bookmark'), newStatus);
      return newStatus;
    });
  }, [userEmail]);

  const addMockEvent = useCallback((newEvent) => {
    setMockEvents(prev => [...prev, newEvent]);
  }, []);

  return (
    <AlramContext.Provider value={{ 
        userEmail,
        readStatus, 
        bookmarkStatus,
        mockEvents, 
        markAsRead, 
        toggleBookmark,
        addMockEvent,
        loginUser,
        logoutUser
    }}>
      {children}
    </AlramContext.Provider>
  );
};