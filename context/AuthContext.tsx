/* src/context/AuthContext.tsx */
import React, { createContext, useState, useCallback, useEffect, useContext, ReactNode } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { registerUser } from '../api/userService'; 
import { getToken, saveToken, removeToken } from '../utils/storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { AUTH_CONFIG } from '../constants/config';

const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_EMAIL = AUTH_CONFIG.DEV_EMAIL;

// 1. Context 데이터 타입 정의
interface AuthContextType {
  userEmail: string | null;
  isAuthenticated: boolean;
  loginUser: (email: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  userEmail: null,
  isAuthenticated: false,
  loginUser: async () => {},
  logoutUser: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 백엔드 동기화 로직
  const syncUserToBackend = async (email: string) => {
    let expoPushToken: string | null = null;
    try {
      expoPushToken = await registerForPushNotificationsAsync();
    } catch (e) {
      console.warn("푸시 토큰 발급 실패:", e);
    }

    try {
      console.log(`📡 [Auth] 백엔드 동기화 시도: ${email}`);
      await registerUser(email, expoPushToken); 
    } catch (e) {
      console.error("❌ [Auth] 백엔드 동기화 에러:", e);
    }
  };

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

      // 개발자 모드 체크
      if (token === DEV_TOKEN) {
        setUserEmail(DEV_EMAIL);
        return;
      }

      try {
        const userInfo = await GoogleSignin.signInSilently();
        const email = userInfo.data?.user.email;
        
        if (email) {
           setUserEmail(email);
           const tokens = await GoogleSignin.getTokens();
           if (tokens.accessToken) await saveToken(tokens.accessToken);
           await syncUserToBackend(email);
        }
      } catch (e: any) {
        console.log("❌ [Auth] 세션 복구 실패:", e.code);
        await logoutUser(); 
      }
    };

    initializeAuth();
  }, []);

  const loginUser = useCallback(async (email: string) => {
    setUserEmail(email);
    if (email !== DEV_EMAIL) {
      await syncUserToBackend(email);
    }
  }, []);

  const logoutUser = useCallback(async () => {
    console.log("👋 [Auth] 로그아웃 실행");
    try {
        if (userEmail && userEmail !== DEV_EMAIL) {
             try {
                await GoogleSignin.revokeAccess();
                await GoogleSignin.signOut();
             } catch(e) {
                console.warn("구글 세션 해제 중 오류 (무시하고 진행):", e);
             }
        }
    } finally {
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