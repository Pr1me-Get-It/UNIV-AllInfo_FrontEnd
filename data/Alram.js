/* data/Alram.js */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
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
    readStatus: {},
    bookmarkStatus: {},     
    mockEvents: [], 
    markAsRead: () => {}, 
    toggleBookmark: () => {},
    refreshBookmarks: () => {},
    addMockEvent: () => {},
});

export const AlramProvider = ({ children }) => {
  const [readStatus, setReadStatus] = useState({});
  const [bookmarkStatus, setBookmarkStatus] = useState({});
  const [userEmail, setUserEmail] = useState(null);
  const [mockEvents, setMockEvents] = useState(INITIAL_MOCK_EVENTS);

  // 👇 [수정] 이메일을 안전한 문자열로 변환 (공통 함수)
  const getSafeEmail = (email) => {
    return email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  };

  // 👇 [추가] 읽음 상태 불러오기
  const loadReadStatus = async (email) => {
    try {
      const safeEmail = getSafeEmail(email);
      const key = `read_${safeEmail}`; // 키 예시: read_test_knu.ac.kr
      const savedData = await getData(key);
      
      if (savedData) {
        console.log(`📖 읽음 목록 로드: ${Object.keys(savedData).length}개`);
        setReadStatus(savedData);
      }
    } catch (e) {
      console.error("읽음 상태 로드 실패:", e);
    }
  };

  // 👇 [기존] 북마크 불러오기 (키 생성 로직 변경 반영)
  const loadLocalBookmarks = async (email) => {
    try {
      const safeEmail = getSafeEmail(email);
      const key = `bookmark_${safeEmail}`;
      const savedData = await getData(key);
      console.log(`📂 북마크 로드: ${savedData ? Object.keys(savedData).length : 0}개`);
      
      if (savedData) {
        setBookmarkStatus(savedData);
      } else {
        setBookmarkStatus({});
      }
    } catch (e) {
      console.error("북마크 로드 실패:", e);
    }
  };

  // 1. 초기 로딩
  useEffect(() => {
    const init = async () => {
      const token = await getToken();
      
      if (token) {
        // 개발자 모드
        if (token === DEV_TOKEN) {
            console.log("⚡ [Alram] 개발자 모드");
            setUserEmail(DEV_EMAIL);
            await loadLocalBookmarks(DEV_EMAIL);
            await loadReadStatus(DEV_EMAIL); // 👈 읽음 상태도 로드
            return;
        }

        // 일반 사용자
        try {
          const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const userInfo = await res.json();
            if (userInfo.email) {
              setUserEmail(userInfo.email);
              await loadLocalBookmarks(userInfo.email);
              await loadReadStatus(userInfo.email); // 👈 읽음 상태도 로드
            }
          }
        } catch (e) {
           console.error("유저 정보 로딩 실패:", e);
        }
      }
    };
    init();
  }, []);

  // 👇 [수정] 읽음 처리 시 저장소에도 반영
  const markAsRead = useCallback((id, isRead = true) => {
    setReadStatus(prev => {
      const newStatus = { ...prev, [id]: isRead };
      
      // 이메일이 있을 때만 저장
      if (userEmail) {
        const safeEmail = getSafeEmail(userEmail);
        const key = `read_${safeEmail}`;
        saveData(key, newStatus); // 비동기 저장 (await 안 해도 됨)
      }
      
      return newStatus;
    });
  }, [userEmail]); // userEmail 의존성 추가

  // 👇 [기존] 북마크 토글 (키 생성 로직 변경 반영)
  const toggleBookmark = useCallback(async (item) => {
    if (!userEmail) {
        alert("로그인이 필요합니다.");
        return;
    }

    setBookmarkStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[item.id]) {
        delete newStatus[item.id];
      } else {
        newStatus[item.id] = item;
      }
      
      const safeEmail = getSafeEmail(userEmail);
      const key = `bookmark_${safeEmail}`;
      saveData(key, newStatus);

      return newStatus;
    });

    try {
      api.post(`/notice/like/${item.id}`, { email: userEmail }).catch(() => {});
    } catch (e) {}
    
  }, [userEmail]);

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
        refreshBookmarks: () => userEmail && loadLocalBookmarks(userEmail),
        addMockEvent 
    }}>
      {children}
    </AlramContext.Provider>
  );
};