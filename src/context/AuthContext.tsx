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
import { saveScore } from '../api/gameScore'; // Added import
import { getToken, saveToken, removeToken, getData, saveData, removeData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { GAMES } from '../constants/games'; // Added games for iteration
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
  gameBestScores: { [key: number]: number }; // 게임별 최고 점수 (로컬 관리)
  updateGameBestScore: (gameId: number, score: number, shouldSaveToServer?: boolean) => Promise<void>; // 점수 업데이트
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
  const [gameBestScores, setGameBestScores] = useState<{ [key: number]: number }>({}); // Added state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 게임 점수 로드 함수
  const loadGameBestScores = async (email: string) => {
    try {
      const safeEmail = email.replace(/\./g, '_');

      // 1. 기존 로컬 점수 로드 (백엔드 오류 시 폴백용)
      const savedScores = await getData<{ [key: number]: number }>(STORAGE_KEYS.GAME_SCORES(safeEmail)) || {};

      // 2. 백엔드에서 모든 게임의 최신 점수 로드
      const newScores: { [key: number]: number } = {};
      const gameList = Object.values(GAMES);

      await Promise.all(
        gameList.map(async (game) => {
          try {
            const { getBestScore } = await import('../api/gameScore');
            const response = await getBestScore(game.id, email);
            if (response.data && typeof response.data.bestScore === 'number') {
              newScores[game.id] = response.data.bestScore;
            } else {
              // 백엔드에 데이터가 없으면 0점 처리 (동기화)
              newScores[game.id] = 0;
            }
          } catch (error: any) {
            // 개별 API 실패 시 로컬 점수 유지
            // 백엔드에서 데이터가 없을 때 500을 반환하도록 되어 있으므로, 500 에러는 경고를 띄우지 않음
            if (error.response?.status !== 500 && __DEV__) {
              console.warn(`Failed to fetch score for game ${game.id}:`, error.message);
            }
            newScores[game.id] = savedScores[game.id] || 0;
          }
        })
      );

      // 3. 동기화된 점수를 상태 및 로컬 스토리지에 업데이트
      setGameBestScores(newScores);
      await saveData(STORAGE_KEYS.GAME_SCORES(safeEmail), newScores);
      if (__DEV__) console.log('📡 [Auth] 게임 점수 서버 동기화 완료:', newScores);

    } catch (e) {
      console.error('Failed to load/sync game scores:', e);
    }
  };

  // 게임 점수 업데이트 함수
  const updateGameBestScore = useCallback(async (gameId: number, score: number, shouldSaveToServer: boolean = true) => {
    if (!userEmail) return;

    const currentBest = gameBestScores[gameId] || 0;

    // 점수가 더 높을 때만 업데이트 (혹은 강제 동기화일 경우)
    // shouldSaveToServer가 false이면 로컬 동기화 목적이므로 점수가 같다면 업데이트 불필요하지만
    // 여기서는 score > currentBest 조건이 있으므로 '더 높은 점수'를 발견했을 때만 동작함.
    if (score > currentBest) {
      const newScores = { ...gameBestScores, [gameId]: score };
      setGameBestScores(newScores);

      const safeEmail = userEmail.replace(/\./g, '_');
      // 로컬 저장
      await saveData(STORAGE_KEYS.GAME_SCORES(safeEmail), newScores);

      // 서버 저장 (플래그가 true일 때만)
      if (shouldSaveToServer) {
        const nicknameToSave = nickname || '사용자';
        try {
          if (__DEV__) console.log(`🎮 [Auth] 신기록 달성! 서버 저장 시도: ${score}점`);
          await saveScore(userEmail, gameId, score, { nickname: nicknameToSave });
        } catch (e) {
          console.warn('Failed to save score to server:', e);
        }
      }
    }
  }, [userEmail, nickname, gameBestScores]);


  // 백엔드 동기화 로직 (유지)
  const syncUserToBackend = async (email: string) => {
    // ... (Existing logic for push token, registerUser)
    let expoPushToken: string | null = null;
    try {
      expoPushToken = await registerForPushNotificationsAsync();

    } catch (e) {
      if (__DEV__) console.warn('푸시 토큰 발급 실패:', e);
    }



    try {
      await registerUser(email, expoPushToken);

    } catch (e: any) {
      if (e.response && e.response.status === 409) {

      } else {

        return;
      }
    }

    // C. 키워드 동기화 
    try {
      const safeEmail = email.replace(/\./g, '_');
      const localKeywords = (await getData<string[]>(STORAGE_KEYS.KEYWORDS(safeEmail))) || [];
      const response = await syncKeywords(email, localKeywords);

      if (response.data.success) {
        const serverKeywords = response.data.keywords;
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
        // USER_INFO 캐시에도 닉네임 반영 (다음 앱 재시작 시 즉시 복원)
        try {
          const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
          if (cachedUser) {
            await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, nickname: savedNickname });
          }
        } catch (_) { }
      } else {
        // 기존 닉네임이 없을 경우, 무조건 '호반우+4자리숫자' 랜덤 발급
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000 ~ 9999
        const generatedNickname = `호반우${randomNum}`;
        if (__DEV__) console.log(`🔍 [AuthDebug] 생성된 닉네임이 없어 '${generatedNickname}'(으)로 초기화합니다.`);
        
        setNickname(generatedNickname);
        await saveData(STORAGE_KEYS.NICKNAME(safeEmail), generatedNickname);
        
        // USER_INFO 캐시에도 닉네임 반영
        try {
          const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
          if (cachedUser) {
            await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, nickname: generatedNickname });
          }
        } catch (_) { }
      }
    } catch (e) {
      if (__DEV__) console.warn("닉네임 로드 실패:", e);
    }

    // E. 게임 점수 로드 (추가)
    await loadGameBestScores(email);
  };

  // ... (rest of the file)


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
        // 로컬에서 유저 정보 복구 시도 (앱 껐다 켰을 때 즉시 로그인 유지)
        const cachedUser = await getData<{ userEmail: string, userInfo: UserInfo, nickname?: string }>(STORAGE_KEYS.USER_INFO);
        if (cachedUser?.userEmail) {
          setUserEmail(cachedUser.userEmail);
          setUserInfo(cachedUser.userInfo);
          // 캐시된 닉네임도 즉시 복원 (ProfileScreen 모달 방지)
          if (cachedUser.nickname) {
            setNickname(cachedUser.nickname);
          }
          syncUserToBackend(cachedUser.userEmail);
        }

        const silentResponse = await GoogleSignin.signInSilently();
        if (silentResponse.data?.user) {
          const { user } = silentResponse.data;
          const newInfo = { name: user.name || '', email: user.email, picture: user.photo };
          setUserEmail(user.email);
          setUserInfo(newInfo);
          await saveData(STORAGE_KEYS.USER_INFO, { userEmail: user.email, userInfo: newInfo });

          const tokens = await GoogleSignin.getTokens();
          if (tokens.accessToken) await saveToken(tokens.accessToken);
          await syncUserToBackend(user.email);
        }
      } catch (e) {
        if (__DEV__) console.error('❌ [Auth] 세션 복구 실패 (상세):', e);
        // signInSilently가 실패해도 토큰/캐시가 있으면 로그인 유지
        const cachedUser = await getData(STORAGE_KEYS.USER_INFO);
        if (!cachedUser) {
          await logout();
        }
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
        const newInfo = { name: user.name || '', email: user.email, picture: user.photo };
        setUserEmail(user.email);
        setUserInfo(newInfo);
        await saveData(STORAGE_KEYS.USER_INFO, { userEmail: user.email, userInfo: newInfo });
        await syncUserToBackend(user.email);
      }
    } catch (error: any) {
      Alert.alert(
        "구글 로그인 에러 발생",
        `코드: ${error.code}\n메시지: ${error.message}\nID: ${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'ID 없음'}`
      );

      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.error('[GoogleLoginError]', error);
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
      const newInfo = {
        name: `개발자(${targetEmail.split('@')[0]})`,
        email: targetEmail,
        picture: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
      };
      setUserEmail(targetEmail);
      setUserInfo(newInfo);
      await saveData(STORAGE_KEYS.USER_INFO, { userEmail: targetEmail, userInfo: newInfo });
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
      await removeData(STORAGE_KEYS.USER_INFO);
      setUserEmail(null);
      setUserInfo(null);
      setNickname(null); // 닉네임 상태 초기화
      setIsLoading(false);
      if (__DEV__) console.log('📡 [AuthContext] logout 완료 (상태 초기화됨)'); // 추가
    }
  }, [userEmail]);

  // 회원 탈퇴 함수
  const withdraw = useCallback(async () => {
    if (__DEV__) console.log('📡 [AuthContext] withdraw 함수 시작');
    setIsLoading(true);
    try {
      if (userEmail && userEmail !== DEV_EMAIL) {
        // 1. 백엔드에 회원 탈퇴 요청
        await withdrawUser(userEmail);
        if (__DEV__) console.log('📡 [AuthContext] 백엔드 회원 탈퇴 성공');

        // 2. 구글 연동 해제 (선택)
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        } catch (e) {
          console.warn('구글 세션 해제(revoke) 중 오류 (무시):', e);
        }
      }

      // 3. 로컬 데이터 클리어 및 초기화
      if (__DEV__) console.log('📡 [AuthContext] 로컬 데이터 삭제 및 유저 리셋');

      if (userEmail) {
        const safeEmail = userEmail.replace(/\./g, '_');
        await removeData(STORAGE_KEYS.NICKNAME(safeEmail));
        await removeData(STORAGE_KEYS.KEYWORDS(safeEmail));
        await removeData(STORAGE_KEYS.BOOKMARK(safeEmail));
        await removeData(STORAGE_KEYS.READ(safeEmail));
        await removeData(STORAGE_KEYS.PUSH_SETTING(safeEmail));
        await removeData(STORAGE_KEYS.MAP_FILTER(safeEmail));
        await removeData(STORAGE_KEYS.FILTER_MODE(safeEmail));
        await removeData(STORAGE_KEYS.GAME_SCORES(safeEmail));
      }

      await removeToken();
      await removeData(STORAGE_KEYS.USER_INFO);
      setUserEmail(null);
      setUserInfo(null);
      setNickname(null); // 닉네임 상태 초기화
      setGameBestScores({}); // 메모리의 게임 점수 초기화
      if (__DEV__) console.log('✅ [AuthContext] 회원 탈퇴 프로세스 완료');
    } catch (error) {
      console.error('❌ [AuthContext] 회원 탈퇴 에러:', error);
      throw error; // 에러를 ProfileScreen으로 전달
    } finally {
      setIsLoading(false);
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
      // USER_INFO 캐시에도 닉네임 반영 (앱 재시작 시 즉시 복원)
      const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
      if (cachedUser) {
        await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, nickname: name });
      }
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
        gameBestScores,
        updateGameBestScore,
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
