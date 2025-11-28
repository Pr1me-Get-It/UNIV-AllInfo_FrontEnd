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

  // 👇 [추가] 이메일을 SecureStore 키로 쓸 수 있게 변환하는 도우미 함수
  // 예: test@knu.ac.kr -> bookmark_test_knu.ac.kr
  const getSafeKey = (email) => {
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_'); 
    return `bookmark_${safeEmail}`;
  };

  // 👇 [수정] 키 생성 부분에 getSafeKey 적용
  const loadLocalBookmarks = async (email) => {
    try {
      const key = getSafeKey(email); // 👈 수정됨
      const savedData = await getData(key);
      console.log(`📂 [Alram] 북마크 로드 (${email}):`, savedData ? Object.keys(savedData).length : 0, "개");
      
      if (savedData) {
        setBookmarkStatus(savedData);
      } else {
        setBookmarkStatus({});
      }
    } catch (e) {
      console.error("북마크 로드 실패:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await getToken();
      
      if (token) {
        if (token === DEV_TOKEN) {
            console.log("⚡ [Alram] 개발자 모드");
            setUserEmail(DEV_EMAIL);
            await loadLocalBookmarks(DEV_EMAIL);
            return;
        }

        try {
          const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const userInfo = await res.json();
            if (userInfo.email) {
              setUserEmail(userInfo.email);
              await loadLocalBookmarks(userInfo.email);
            }
          }
        } catch (e) {
           console.error("유저 정보 로딩 실패:", e);
        }
      }
    };
    init();
  }, []);

  const markAsRead = useCallback((id, isRead = true) => {
    setReadStatus(prev => ({ ...prev, [id]: isRead }));
  }, []);

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
      
      // 👇 [수정] 저장할 때도 getSafeKey 사용
      const key = getSafeKey(userEmail); 
      saveData(key, newStatus).then(() => console.log("💾 북마크 저장 완료"));

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