import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { registerUser } from '../api/userService'; // 1. 분리된 서비스 함수 임포트
import { getToken, saveToken, removeToken } from '../utils/storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { AUTH_CONFIG } from '../constants/config';

const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_EMAIL = AUTH_CONFIG.DEV_EMAIL

export const AuthContext = createContext({
  userEmail: null,
  isAuthenticated: false,
  loginUser: () => {},
  logoutUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'], 
      });

      const token = await getToken();
      if (!token) return;

      if (token === DEV_TOKEN) {
        setUserEmail(DEV_EMAIL);
        return;
      }

      try {
        const userInfo = await GoogleSignin.signInSilently();
        if (userInfo?.data?.user) {
           const email = userInfo.data.user.email;
           setUserEmail(email);

           const { accessToken } = await GoogleSignin.getTokens();
           if (accessToken) await saveToken(accessToken);

           syncUserToBackend(email);
        }
      } catch (e) {
        console.log("❌ [Auth] 세션 복구 실패:", e.code);
        await logoutUser(); 
      }
    };

    initializeAuth();
  }, []);

  // 2. 직접적인 api.post 호출을 userService의 함수로 대체
  const syncUserToBackend = async (email) => {
      let pushToken = null;
      try {
         pushToken = await registerForPushNotificationsAsync();
      } catch(e) {
         console.warn("푸시 토큰 발급 실패:", e);
      }

      try {
        console.log(`📡 [Auth] 백엔드 동기화 시도: ${email}`);
        // 중복 로직 제거: userService.js의 함수를 호출함
        await registerUser(email, pushToken || null); 
      } catch (e) {
          console.error("❌ [Auth] 백엔드 동기화 에러:", e);
      }
  };

  const loginUser = useCallback(async (email) => {
    setUserEmail(email);
    if (email !== DEV_EMAIL) {
      await syncUserToBackend(email);
    }
  }, []);

  // 3. 로그아웃 로직 안정화 (Try-Finally 활용)
  const logoutUser = useCallback(async () => {
    console.log("👋 [Auth] 로그아웃 실행");
    try {
        // 구글 세션 해제 시도
        if (userEmail && userEmail !== DEV_EMAIL) {
             try {
                await GoogleSignin.revokeAccess();
                await GoogleSignin.signOut();
             } catch(e) {
                console.warn("구글 세션 해제 중 오류 (무시하고 진행):", e);
             }
        }
    } finally {
        // 네트워크 오류와 상관없이 로컬 토큰과 상태는 반드시 삭제
        await removeToken(); 
        setUserEmail(null);
    }
  }, [userEmail]);

  return (
    <AuthContext.Provider value={{ 
        userEmail,
        isAuthenticated: !!userEmail,
        loginUser,
        logoutUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);