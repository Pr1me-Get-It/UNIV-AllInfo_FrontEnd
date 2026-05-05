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
import { gameService } from '../api/gameScore';
import { authService } from '../api/authService';
import { getToken, saveToken, removeToken, saveRefreshToken, removeRefreshToken, getData, saveData, removeData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { GAMES } from '../constants/games'; // Added games for iteration
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { AUTH_CONFIG } from '../constants/config';
import { Alert } from 'react-native';

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
            const { gameService } = await import('../api/gameScore');
            const response = await gameService.getMyRanking(game.type);
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
          const gameList = Object.values(GAMES);
          const game = gameList.find(g => g.id === gameId);
          if (game) {
            if (__DEV__) console.log(`🎮 [Auth] 신기록 달성! 서버 저장 시도: ${score}점`);
            await gameService.postScore(game.type, score);
          }
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
      // await registerUser(email, expoPushToken);
      if (__DEV__) console.log('🔔 푸시 토큰 서버 저장 API 준비중');
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
      // const response = await syncKeywords(email, localKeywords);
      if (__DEV__) console.log('🔔 키워드 동기화 API 준비중');
    } catch (e) {
      if (__DEV__) console.error('❌ [Auth] 키워드 동기화 에러:', e);
    }

    // D. 닉네임 불러오기
    try {
      const safeEmail = email.replace(/\./g, '_');
      if (__DEV__) console.log(`🔍 [AuthDebug] 닉네임 로드 시도: Key=${STORAGE_KEYS.NICKNAME(safeEmail)}`);
      
      let fetchedNickname: string | null = null;
      try {
        const { userService } = await import('../api/userService');
        const profileRes = await userService.getMyProfile();
        if (profileRes.data && profileRes.data.nickname) {
           fetchedNickname = profileRes.data.nickname;
           if (__DEV__) console.log(`🔍 [AuthDebug] 백엔드에서 닉네임 동기화 완료: ${fetchedNickname}`);
        }
      } catch (err: any) {
        if (__DEV__) console.warn('서버에서 닉네임 가져오기 실패 (초기 가입이거나 네트워크 오류 등):', err.message);
      }

      const savedNickname = (await getData(STORAGE_KEYS.NICKNAME(safeEmail))) as string | null;
      const finalNickname = fetchedNickname || savedNickname;

      if (finalNickname) {
        setNickname(finalNickname);
        await saveData(STORAGE_KEYS.NICKNAME(safeEmail), finalNickname);
        // USER_INFO 캐시에도 닉네임 반영 (다음 앱 재시작 시 즉시 복원)
        try {
          const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
          if (cachedUser) {
            await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, nickname: finalNickname });
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
        const { user, idToken } = response.data;
        const { accessToken } = await GoogleSignin.getTokens();

        let backendToken = null;
        let backendRefreshToken = null;
        let backendNickname = null;
        
        if (idToken) {
          try {
            const authResponse = await authService.loginWithGoogle(idToken);
            if (authResponse.data && authResponse.data.accessToken) {
              backendToken = authResponse.data.accessToken;
              backendRefreshToken = authResponse.data.refreshToken;
              
              // 백엔드 응답에서 닉네임 추출 (authResponse.data 구조에 따라 유연하게 추출)
              backendNickname = authResponse.data.nickname || 
                                authResponse.data.user?.nickname || 
                                authResponse.data.profile?.nickname;
            }
          } catch (e: any) {
            console.error('Failed to send idToken to backend:', e);
            let errorMessage = '백엔드 서버 인증에 실패했습니다.';
            if (e.response && e.response.data) {
                console.error('Backend error response:', e.response.data);
                errorMessage += `\n상세: ${JSON.stringify(e.response.data)}`;
            }
            Alert.alert('로그인 오류', `${errorMessage}\n상태 코드: ${e.response?.status}`);
            setIsLoading(false);
            return;
          }
        }

        if (backendToken) {
          await saveToken(backendToken);
          if (backendRefreshToken) await saveRefreshToken(backendRefreshToken);
        } else if (accessToken) {
          await saveToken(accessToken);
        }

        const newInfo = { name: user.name || '', email: user.email, picture: user.photo };
        setUserEmail(user.email);
        setUserInfo(newInfo);
        
        // 백엔드 응답에서 닉네임을 찾은 경우 로컬 스토리지에 캐싱
        if (backendNickname) {
          const safeEmail = user.email.replace(/\./g, '_');
          await saveData(STORAGE_KEYS.NICKNAME(safeEmail), backendNickname);
        }

        await saveData(STORAGE_KEYS.USER_INFO, { 
          userEmail: user.email, 
          userInfo: newInfo,
          ...(backendNickname ? { nickname: backendNickname } : {})
        });
        
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



  // 통합 로그아웃 함수
  const logout = useCallback(async () => {
    if (__DEV__) console.log('📡 [AuthContext] logout 함수 시작'); // 추가
    setIsLoading(true);
    try {
      if (userEmail) {
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
      await removeRefreshToken();
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
      if (userEmail) {
        // 1. 백엔드에 회원 탈퇴 요청
        await authService.withdrawUser();
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
      await removeRefreshToken();
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
