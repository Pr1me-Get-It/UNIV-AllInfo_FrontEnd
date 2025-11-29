/* data/Alram.js */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { api } from '../api/client';
import { getToken, saveToken, removeToken, saveData, getData } from '../utils/storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';

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
    loginUser: () => {}, 
    logoutUser: () => {},
});

export const AlramProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [readStatus, setReadStatus] = useState({});
  const [bookmarkStatus, setBookmarkStatus] = useState({});
  const [mockEvents, setMockEvents] = useState(INITIAL_MOCK_EVENTS);

  const getSafeKey = (email, type) => {
    if (!email) return '';
    const safeEmail = email.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `${type}_${safeEmail}`;
  };

  const loadUserData = async (email) => {
    if (!email) return;
    try {
        const bookmarkKey = getSafeKey(email, 'bookmark');
        const readKey = getSafeKey(email, 'read');

        const [savedBookmarks, savedReads] = await Promise.all([
            getData(bookmarkKey),
            getData(readKey)
        ]);

        setBookmarkStatus(savedBookmarks || {});
        setReadStatus(savedReads || {});
        console.log(`📂 [Alram] ${email} 데이터 로드 완료`);
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
  };

  // 👇 앱 켜질 때 실행되는 핵심 로직
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. 구글 설정
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'], 
      });

      const token = await getToken();
      if (!token) return;

      // 2. 개발자 모드 복구
      if (token === DEV_TOKEN) {
        console.log("⚡ [Alram] 개발자 모드 복구");
        setUserEmail(DEV_EMAIL);
        await loadUserData(DEV_EMAIL);
        return;
      }

      // 3. 일반 구글 로그인 복구 (Silent Sign-In)
      try {
        const userInfo = await GoogleSignin.signInSilently();
        if (userInfo && userInfo.data && userInfo.data.user) {
           const email = userInfo.data.user.email;
           setUserEmail(email);
           await loadUserData(email);

           // 토큰 최신화
           const { accessToken } = await GoogleSignin.getTokens();
           if (accessToken) await saveToken(accessToken);

           // 4. 백엔드 동기화 (푸시 토큰 포함)
           syncUserToBackend(email);
        }
      } catch (e) {
        console.log("❌ 세션 복구 실패 (재로그인 필요):", e.code);
        // 세션 만료 시 로그아웃 처리
        await logoutUser(); 
      }
    };

    initializeAuth();
  }, []);

  const syncUserToBackend = async (email) => {
      let pushToken = null;
      try {
         pushToken = await registerForPushNotificationsAsync();
      } catch(e) {}

      try {
        console.log(`📡 백엔드 동기화: ${email}`);
        await api.post('/user/register', {
            email: email,
            expoPushToken: pushToken || null
        });
      } catch (e) {
          console.error("백엔드 동기화 에러:", e);
      }
  };

  const loginUser = useCallback(async (email) => {
    console.log(`👤 [Alram] 로그인 진입: ${email}`);
    setUserEmail(email);
    await loadUserData(email);
    // 로그인 직후에도 백엔드 동기화 시도
    if (email !== DEV_EMAIL) syncUserToBackend(email);
  }, []);

  const logoutUser = useCallback(async () => {
    console.log("👋 [Alram] 로그아웃 처리");
    try {
        await removeToken();
        if (userEmail && userEmail !== DEV_EMAIL) {
             try {
                await GoogleSignin.revokeAccess();
                await GoogleSignin.signOut();
             } catch(e) {}
        }
    } catch (e) {}
    
    setUserEmail(null);
    setBookmarkStatus({});
    setReadStatus({});
  }, [userEmail]);

  const markAsRead = useCallback((id, isRead = true) => {
    if (!userEmail) return; 
    setReadStatus(prev => {
      const newStatus = { ...prev, [id]: isRead };
      saveData(getSafeKey(userEmail, 'read'), newStatus);
      return newStatus;
    });
  }, [userEmail]);

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