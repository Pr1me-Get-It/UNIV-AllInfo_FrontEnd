/* src/context/AuthContext.tsx */
import React, { createContext, useState, useCallback, useEffect, useContext, ReactNode } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { registerUser } from '../api/userService';
import { getToken, saveToken, removeToken, getData, saveData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { AUTH_CONFIG } from '../constants/config';
import { Alert } from 'react-native';
import { syncKeywords } from '../api/userService';


const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_EMAIL = AUTH_CONFIG.DEV_EMAIL;

// 1. 사용자 정보 타입 정의
interface UserInfo {
  name: string | null;
  email: string;
  picture: string | null;
}

// 2. Context 데이터 타입 정의
interface AuthContextType {
  userEmail: string | null;
  userInfo: UserInfo | null; // UI 출력을 위한 유저 정보
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>; // 구글 로그인 로직 내장
  loginDev: () => Promise<void>;       // 개발자 로그인 로직 내장
  logout: () => Promise<void>;         // 통합 로그아웃
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 백엔드 동기화 로직 (유지)
  const syncUserToBackend = async (email: string) => {
    let expoPushToken: string | null = null;
    try {
      expoPushToken = await registerForPushNotificationsAsync();
    } catch (e) {
      console.warn("푸시 토큰 발급 실패:", e);
    }

    try {
      await registerUser(email, expoPushToken);
      console.log(`📡 [Auth] 백엔드 신규 등록 성공: ${email}`);
    } catch (e: any) {
      // 409 에러는 이미 가입된 유저이므로 에러가 아닌 '성공'의 범주로 처리합니다.
      if (e.response && e.response.status === 409) {
        console.log(`📡 [Auth] 기존 유저 로그인 확인: ${email}`);
      } else {
        console.error("❌ [Auth] 백엔드 등록 에러:", e);
        // 등록에 실패하면 키워드 동기화도 어려울 수 있으므로 중단하거나 리턴합니다.
        return;
      }
    }

    // C. 키워드 동기화 (추가된 로직)
    try {
    // 1. 이메일에서 마침표(.) 등 특수문자 제거 (Storage Key 안전성 확보)
    const safeEmail = email.replace(/\./g, '_');

    // 2. getData에 <string[]> 타입을 명시하여 unknown 에러 해결
    const localKeywords = await getData<string[]>(STORAGE_KEYS.KEYWORDS(safeEmail)) || [];

    // 3. 서버에 동기화 시도
    const response = await syncKeywords(email, localKeywords);

    if (response.data.success) {
      const serverKeywords = response.data.keywords;
      // 4. 서버 응답 데이터로 로컬 캐시 업데이트
      await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), serverKeywords);
      console.log(`📡 [Auth] 키워드 동기화 완료:`, serverKeywords);
    }
  } catch (e) {
    console.error("❌ [Auth] 키워드 동기화 에러:", e);
  }
  };

  // 초기화 및 자동 로그인 체크
  useEffect(() => {
    const initializeAuth = async () => {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
      });

      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (token === DEV_TOKEN) {
        setUserEmail(DEV_EMAIL);
        setUserInfo({ name: "개발자", email: DEV_EMAIL, picture: "https://cdn-icons-png.flaticon.com/512/25/25231.png" });
        setIsLoading(false);
        return;
      }

      try {
        const silentResponse = await GoogleSignin.signInSilently();
        if (silentResponse.data?.user) {
          const { user } = silentResponse.data;
          setUserEmail(user.email);
          setUserInfo({ name: user.name || "", email: user.email, picture: user.photo });

          const tokens = await GoogleSignin.getTokens();
          if (tokens.accessToken) await saveToken(tokens.accessToken);
          await syncUserToBackend(user.email);
        }
      } catch (e) {
        console.log("❌ [Auth] 세션 복구 실패, 로그아웃 처리");
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 실제 구글 로그인 실행 함수 
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.data?.user) {
        const { user } = response.data;
        const { accessToken } = await GoogleSignin.getTokens();

        if (accessToken) await saveToken(accessToken);
        setUserEmail(user.email);
        setUserInfo({ name: user.name || "", email: user.email, picture: user.photo });
        await syncUserToBackend(user.email);
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("로그인 오류", "구글 로그인에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 개발자 로그인 실행 함수
  const loginDev = async () => {
    setIsLoading(true);
    try {
      await saveToken(DEV_TOKEN);
      setUserEmail(DEV_EMAIL);
      setUserInfo({ name: "개발자 ", email: DEV_EMAIL, picture: "https://cdn-icons-png.flaticon.com/512/25/25231.png" });
      await syncUserToBackend(DEV_EMAIL);
    } finally {
      setIsLoading(false);
    }
  };

  // 통합 로그아웃 함수
  const logout = useCallback(async () => {
    console.log("📡 [AuthContext] logout 함수 시작"); // 추가
    setIsLoading(true);
    try {
      if (userEmail && userEmail !== DEV_EMAIL) {
        console.log("📡 [AuthContext] 구글 세션 해제 시도 중..."); // 추가
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          console.log("📡 [AuthContext] 구글 세션 해제 완료"); // 추가
        } catch (e) {
          console.warn("구글 세션 해제 중 오류 (무시):", e);
        }
      }
    } finally {
      console.log("📡 [AuthContext] 로컬 토큰 삭제 및 상태 초기화 시작"); // 추가
      await removeToken();
      setUserEmail(null);
      setUserInfo(null);
      setIsLoading(false);
      console.log("📡 [AuthContext] logout 완료 (상태 초기화됨)"); // 추가
    }
  }, [userEmail]);

  return (
    <AuthContext.Provider value={{
      userEmail,
      userInfo,
      isAuthenticated: !!userEmail,
      isLoading,
      loginWithGoogle,
      loginDev,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider 내에서 useAuth를 사용해야 합니다.");
  return context;
};