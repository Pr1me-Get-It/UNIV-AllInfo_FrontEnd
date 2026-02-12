/* src/context/AuthContext.tsx */
import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { registerUser, withdrawUser } from '../api/userService';
import { getToken, saveToken, removeToken, getData, saveData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { AUTH_CONFIG } from '../constants/config';
import { Alert } from 'react-native';
import { syncKeywords } from '../api/userService';

const DEV_TOKEN = 'DEV_MODE_ACCESS_TOKEN';
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
  nickname: string | null; // 전역 닉네임
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>; // 구글 로그인 로직 내장
  loginDev: (customEmail?: string) => Promise<void>; // 개발자 로그인 로직 내장 (이메일 선택 가능)
  logout: () => Promise<void>; // 통합 로그아웃
  withdraw: () => Promise<void>; // 회원 탈퇴
  updateNickname: (name: string) => Promise<void>; // 닉네임 업데이트 함수
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 백엔드 동기화 로직 (유지)
  const syncUserToBackend = async (email: string) => {
    let expoPushToken: string | null = null;
    try {
      expoPushToken = await registerForPushNotificationsAsync();
      if (__DEV__) console.log(`🔍 [AuthDebug] 발급된 Expo Token: ${expoPushToken ? expoPushToken : 'NULL (발급실패)'}`);
    } catch (e) {
      if (__DEV__) console.warn('푸시 토큰 발급 실패:', e);
    }

    if (__DEV__) console.log(`🔍 [AuthDebug] 백엔드 등록 시도: Email=${email}, Token=${expoPushToken}`);

    try {
      await registerUser(email, expoPushToken);
      if (__DEV__) console.log(`📡 [Auth] 백엔드 신규 등록 성공: ${email}`);
    } catch (e: any) {
      // 409 에러는 이미 가입된 유저이므로 에러가 아닌 '성공'의 범주로 처리합니다.
      if (e.response && e.response.status === 409) {
        if (__DEV__) console.log(`📡 [Auth] 기존 유저 로그인 확인: ${email}`);
      } else {
        if (__DEV__) console.error('❌ [Auth] 백엔드 등록 에러 (상세):', JSON.stringify(e.response?.data || e.message, null, 2));
        // 등록에 실패하면 키워드 동기화도 어려울 수 있으므로 중단하거나 리턴합니다.
        return;
      }
    }

    // C. 키워드 동기화 (추가된 로직)
    try {
      // 1. 이메일에서 마침표(.) 등 특수문자 제거 (Storage Key 안전성 확보)
      const safeEmail = email.replace(/\./g, '_');

      // 2. getData에 <string[]> 타입을 명시하여 unknown 에러 해결
      const localKeywords = (await getData<string[]>(STORAGE_KEYS.KEYWORDS(safeEmail))) || [];

      // 3. 서버에 동기화 시도
      const response = await syncKeywords(email, localKeywords);

      if (response.data.success) {
        const serverKeywords = response.data.keywords;
        // 4. 서버 응답 데이터로 로컬 캐시 업데이트
        await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), serverKeywords);
        if (__DEV__) console.log(`📡 [Auth] 키워드 동기화 완료:`, serverKeywords);
      }
    } catch (e) {
      if (__DEV__) console.error('❌ [Auth] 키워드 동기화 에러:', e);
    }

    // D. 닉네임 불러오기
    try {
      const safeEmail = email.replace(/\./g, '_');
      if (__DEV__) console.log(`🔍 [AuthDebug] 닉네임 로드 시도: Key=${STORAGE_KEYS.NICKNAME(safeEmail)}`);
      const savedNickname = (await getData(STORAGE_KEYS.NICKNAME(safeEmail))) as string | null;
      if (__DEV__) console.log(`🔍 [AuthDebug] 로드된 닉네임: ${savedNickname}`);

      if (savedNickname) {
        setNickname(savedNickname);
      } else {
        if (__DEV__) console.log(`🔍 [AuthDebug] 저장된 닉네임이 없어 userInfo.name 사용 예정`);
        setNickname(null);
      }
    } catch (e) {
      if (__DEV__) console.warn("닉네임 로드 실패:", e);
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
        setUserInfo({
          name: '개발자',
          email: DEV_EMAIL,
          picture: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
        });
        setIsLoading(false);
        // 개발자 모드라도 저장된 닉네임은 불러와야 함
        await syncUserToBackend(DEV_EMAIL);
        return;
      }

      try {
        const silentResponse = await GoogleSignin.signInSilently();
        if (silentResponse.data?.user) {
          const { user } = silentResponse.data;
          setUserEmail(user.email);
          setUserInfo({ name: user.name || '', email: user.email, picture: user.photo });

          const tokens = await GoogleSignin.getTokens();
          if (tokens.accessToken) await saveToken(tokens.accessToken);
          await syncUserToBackend(user.email);
        }
      } catch (e) {
        if (__DEV__) console.error('❌ [Auth] 세션 복구 실패 (상세):', e);
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
        setUserInfo({ name: user.name || '', email: user.email, picture: user.photo });
        await syncUserToBackend(user.email);
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.error('[GoogleLoginError]', error); // ADB 로그 확인용
        throw error; // UI에서 예외 처리하도록 전파
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 개발자 로그인 실행 함수
  const loginDev = async (customEmail?: string) => {
    setIsLoading(true);
    const targetEmail = customEmail || DEV_EMAIL; // 인자가 없으면 기본값 사용

    try {
      await saveToken(DEV_TOKEN);
      setUserEmail(targetEmail);
      setUserInfo({
        name: `개발자(${targetEmail.split('@')[0]})`,
        email: targetEmail,
        picture: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
      });
      await syncUserToBackend(targetEmail);
    } finally {
      setIsLoading(false);
    }
  };

  // 통합 로그아웃 함수
  const logout = useCallback(async () => {
    if (__DEV__) console.log('📡 [AuthContext] logout 함수 시작'); // 추가
    setIsLoading(true);
    try {
      if (userEmail && userEmail !== DEV_EMAIL) {
        if (__DEV__) console.log('📡 [AuthContext] 구글 세션 해제 시도 중...'); // 추가
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          if (__DEV__) console.log('📡 [AuthContext] 구글 세션 해제 완료'); // 추가
        } catch (e) {
          if (__DEV__) console.warn('구글 세션 해제 중 오류 (무시):', e);
        }
      }
    } finally {
      if (__DEV__) console.log('📡 [AuthContext] 로컬 토큰 삭제 및 상태 초기화 시작'); // 추가
      await removeToken();
      setUserEmail(null);
      setUserInfo(null);
      setNickname(null); // 닉네임 상태 초기화
      setIsLoading(false);
      if (__DEV__) console.log('📡 [AuthContext] logout 완료 (상태 초기화됨)'); // 추가
    }
  }, [userEmail]);

  // 회원 탈퇴 함수
  const withdraw = useCallback(async () => {
    console.log('📡 [AuthContext] withdraw 함수 시작');
    setIsLoading(true);
    try {
      if (userEmail && userEmail !== DEV_EMAIL) {
        // 1. 백엔드에 회원 탈퇴 요청
        try {
          await withdrawUser(userEmail);
          console.log('📡 [AuthContext] 백엔드 회원 탈퇴 성공');
        } catch (e: any) {
          console.error('❌ [AuthContext] 백엔드 회원 탈퇴 실패:', e);
          // 실패하더라도 로컬 로그아웃은 진행 여부를 결정해야 하지만,
          // 보통은 서버 실패 시 사용자에게 알리고 중단하거나, 강제 탈퇴 시 진행함.
          // 여기서는 에러 로그만 남기고 일단 진행 (사용자 관점에서는 탈퇴 처리)
        }

        // 2. 구글 연동 해제 (선택)
        // 로그아웃과 동일하게 구글 세션도 해제
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        } catch (e) {
          console.warn('구글 세션 해제(revoke) 중 오류 (무시):', e);
        }
      }
    } finally {
      // 3. 로컬 데이터 클리어 및 초기화 (로그아웃 로직 재사용 가능하지만 명시적으로 수행)
      console.log('📡 [AuthContext] 로컬 데이터 삭제 및 유저 리셋');
      await removeToken();
      setUserEmail(null);
      setUserInfo(null);
      setNickname(null); // 닉네임 상태 초기화
      setIsLoading(false);
      // Alert.alert 제거 -> ProfileScreen에서 처리
      console.log('✅ [AuthContext] 회원 탈퇴 프로세스 완료');
    }
  }, [userEmail]);

  // 닉네임 업데이트 함수
  const updateNickname = useCallback(async (name: string) => {
    if (!userEmail) {
      if (__DEV__) console.error("❌ [AuthDebug] 닉네임 업데이트 실패: userEmail is null");
      return;
    }
    const safeEmail = userEmail.replace(/\./g, '_');
    if (__DEV__) console.log(`💾 [AuthDebug] 닉네임 저장 시도: ${name} (Key=${STORAGE_KEYS.NICKNAME(safeEmail)})`);
    try {
      await saveData(STORAGE_KEYS.NICKNAME(safeEmail), name);
      if (__DEV__) console.log(`✅ [AuthDebug] 닉네임 저장 완료`);
      setNickname(name);
    } catch (e) {
      if (__DEV__) console.error("❌ [AuthDebug] 닉네임 저장 중 에러:", e);
    }
  }, [userEmail]);

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        userInfo,
        nickname,
        isAuthenticated: !!userEmail,
        isLoading,
        loginWithGoogle,
        loginDev,
        logout,
        withdraw,
        updateNickname,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider 내에서 useAuth를 사용해야 합니다.');
  return context;
};
