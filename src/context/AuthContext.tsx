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
import * as AppleAuthentication from 'expo-apple-authentication';
import { gameService } from '../api/gameScore';
import { authService } from '../api/authService';
import {
  getToken,
  saveToken,
  removeToken,
  saveRefreshToken,
  removeRefreshToken,
  getData,
  saveData,
  removeData,
  getRefreshToken,
} from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { GAMES } from '../constants/games'; // Added games for iteration
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { Alert } from 'react-native';
import { setUnauthorizedCallback } from '../api/client';

// 1. 사용자 정보 타입 정의
interface UserInfo {
  name: string | null;
  email: string;
  picture: string | null;
}

// 2. Context 데이터 타입 정의
interface AuthContextType {
  userId: string | null;
  userEmail: string | null;
  userInfo: UserInfo | null;
  nickname: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  gameBestScores: { [key: number]: number }; // 게임별 최고 점수 (로컬 관리)
  updateGameBestScore: (
    gameId: number,
    score: number,
    shouldSaveToServer?: boolean,
  ) => Promise<void>; // 점수 업데이트
  loginWithApple: () => Promise<void>;
  loginWithGoogle: () => Promise<void>; // 구글 로그인 로직 내장
  logout: () => Promise<void>; // 통합 로그아웃
  withdraw: () => Promise<void>; // 회원 탈퇴
  updateNickname: (name: string) => Promise<void>; // 닉네임 업데이트 함수
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [gameBestScores, setGameBestScores] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 게임 점수 로드 함수
  const loadGameBestScores = async (uid: string) => {
    try {
      const savedScores =
        (await getData<{ [key: number]: number }>(STORAGE_KEYS.GAME_SCORES(uid))) || {};

      // 2. 백엔드에서 모든 게임의 최신 점수 로드
      const newScores: { [key: number]: number } = {};
      const gameList = Object.values(GAMES);

      await Promise.all(
        gameList.map(async game => {
          try {
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
        }),
      );

      // 3. 동기화된 점수를 상태 및 로컬 스토리지에 업데이트
      setGameBestScores(newScores);
      await saveData(STORAGE_KEYS.GAME_SCORES(uid), newScores);
      if (__DEV__) console.log('📡 [Auth] 게임 점수 서버 동기화 완료:', newScores);
    } catch (e) {
      console.error('Failed to load/sync game scores:', e);
    }
  };

  // 게임 점수 업데이트 함수
  const updateGameBestScore = useCallback(
    async (gameId: number, score: number, shouldSaveToServer: boolean = true) => {
      if (!userId) return;

      const currentBest = gameBestScores[gameId] || 0;

      if (score > currentBest) {
        const newScores = { ...gameBestScores, [gameId]: score };
        setGameBestScores(newScores);

        await saveData(STORAGE_KEYS.GAME_SCORES(userId), newScores);

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
    },
    [userId, nickname, gameBestScores],
  );

  const syncUserToBackend = async (email: string) => {
    // A. userId, provider 취득 및 캐시 갱신
    let uid: string;
    try {
      const { userService } = await import('../api/userService');
      const infoRes = await userService.getMyInfo();
      uid = infoRes.data.id;
      const provider = infoRes.data.provider as 'GOOGLE' | 'APPLE';
      setUserId(uid);

      // USER_INFO 캐시에 userId, provider 반영
      const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
      if (cachedUser) {
        await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, userId: uid, provider });
      }
    } catch (e) {
      if (__DEV__) console.error('❌ [Auth] userId 취득 실패:', e);
      return;
    }

    // B. 푸시 토큰
    try {
      await registerForPushNotificationsAsync();
      if (__DEV__) console.log('🔔 푸시 토큰 서버 저장 API 준비중');
    } catch (e) {
      if (__DEV__) console.warn('푸시 토큰 발급 실패:', e);
    }

    // C. 닉네임 불러오기
    try {
      let fetchedNickname: string | null = null;
      try {
        const { userService } = await import('../api/userService');
        const profileRes = await userService.getMyProfile();
        if (profileRes.data?.nickname) {
          fetchedNickname = profileRes.data.nickname;
        }
      } catch (err: any) {
        if (__DEV__) console.warn('서버에서 닉네임 가져오기 실패:', err.message);
      }

      const savedNickname = (await getData(STORAGE_KEYS.NICKNAME(uid))) as string | null;
      const finalNickname = fetchedNickname || savedNickname;

      if (finalNickname) {
        setNickname(finalNickname);
        await saveData(STORAGE_KEYS.NICKNAME(uid), finalNickname);
        try {
          const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
          if (cachedUser) {
            await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, nickname: finalNickname });
          }
        } catch (_) {}
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const generatedNickname = `호반우${randomNum}`;
        setNickname(generatedNickname);
        await saveData(STORAGE_KEYS.NICKNAME(uid), generatedNickname);
        try {
          const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
          if (cachedUser) {
            await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, nickname: generatedNickname });
          }
        } catch (_) {}
      }
    } catch (e) {
      if (__DEV__) console.warn('닉네임 로드 실패:', e);
    }

    // D. 게임 점수 로드
    await loadGameBestScores(uid);
  };

  // ... (rest of the file)

  // 초기화 및 자동 로그인 체크
  useEffect(() => {
    const initializeAuth = async () => {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
      });

      let token = await getToken();
      if (!token) {
        // 액세스토큰 없으면 리프레쉬토큰으로 재발급 시도
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          setIsLoading(false);
          return;
        }
        try {
          const { authService } = await import('../api/authService');
          const res = await authService.refreshToken(refreshToken);
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;
          if (!newAccessToken) throw new Error('No access token in refresh response');
          await saveToken(newAccessToken);
          if (newRefreshToken) await saveRefreshToken(newRefreshToken);
          token = newAccessToken;
        } catch (e) {
          if (__DEV__) console.error('❌ [Init] 리프레쉬 토큰으로 재발급 실패:', e);
          await removeToken();
          await removeRefreshToken();
          setIsLoading(false);
          return;
        }
      }

      // 1. 캐시로 즉시 화면 복원 (userId, provider 포함)
      const cachedUser = await getData<{
        userId: string;
        userEmail: string;
        userInfo: UserInfo;
        provider: 'GOOGLE' | 'APPLE';
        nickname?: string;
      }>(STORAGE_KEYS.USER_INFO);

      if (cachedUser?.userEmail) {
        setUserEmail(cachedUser.userEmail);
        setUserInfo(cachedUser.userInfo);
        if (cachedUser.userId) setUserId(cachedUser.userId);
        if (cachedUser.nickname) setNickname(cachedUser.nickname);
      }

      // 2. 구글 유저만 signInSilently로 구글 토큰 갱신
      if (cachedUser?.provider === 'GOOGLE') {
        try {
          const silentResponse = await GoogleSignin.signInSilently();
          if (silentResponse.data?.user) {
            const { user } = silentResponse.data;
            const tokens = await GoogleSignin.getTokens();
            if (tokens.accessToken) {
              await saveData(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, tokens.accessToken);
            }
          }
        } catch (e) {
          if (__DEV__) console.warn('⚠️ [Init] 구글 silent sign-in 실패 (무시):', e);
        }
      }

      // 3. 백엔드 동기화 (구글/애플 공통)
      if (cachedUser?.userEmail) {
        try {
          await syncUserToBackend(cachedUser.userEmail);
        } catch (e) {
          if (__DEV__) console.error('❌ [Init] syncUserToBackend 실패:', e);
          // 동기화 실패해도 캐시 기반으로 로그인 유지
        }
      } else {
        await logout();
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const loginWithApple = async () => {
    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, authorizationCode, fullName, email } = credential;
      if (!identityToken) {
        Alert.alert('오류', '애플 인증 토큰을 받지 못했습니다.');
        return;
      }

      let response;
      try {
        response = await authService.loginWithApple(identityToken, authorizationCode);
      } catch (e: any) {
        console.error('Failed to send idToken to backend:', e);
        Alert.alert('로그인 실패', '애플 로그인 중 문제가 발생했습니다.');
        setIsLoading(false);
        return;
      }

      await saveToken(response.data.accessToken);
      await saveRefreshToken(response.data.refreshToken);

      const backendEmail = response.data.user?.email || email || '';
      const backendNickname = response.data.user?.profile?.nickname || response.data.nickname;

      let userName = '';
      if (fullName?.givenName || fullName?.familyName) {
        userName = `${fullName.familyName || ''}${fullName.givenName || ''}`;
      } else {
        userName = backendNickname || '사용자';
      }

      const newInfo = { name: userName, email: backendEmail, picture: null };

      setUserEmail(backendEmail);
      setUserInfo(newInfo);

      await saveData(STORAGE_KEYS.USER_INFO, {
        userEmail: backendEmail,
        userInfo: newInfo,
        provider: 'APPLE',
      });
      await syncUserToBackend(backendEmail);
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('유저가 로그인 창을 닫음');
      } else {
        Alert.alert('로그인 실패', '애플 로그인 중 문제가 발생했습니다.');
        console.error(e);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
              backendNickname =
                authResponse.data.nickname ||
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

        if (!backendToken) {
          Alert.alert('로그인 오류', '백엔드 인증에 실패했습니다.');
          setIsLoading(false);
          return;
        }

        await saveToken(backendToken);
        if (backendRefreshToken) await saveRefreshToken(backendRefreshToken);
        if (accessToken) await saveData(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, accessToken);

        const newInfo = { name: user.name || '', email: user.email, picture: user.photo };
        setUserEmail(user.email);
        setUserInfo(newInfo);

        await saveData(STORAGE_KEYS.USER_INFO, {
          userEmail: user.email,
          userInfo: newInfo,
          provider: 'GOOGLE',
        });

        await syncUserToBackend(user.email);
      }
    } catch (error: any) {
      Alert.alert(
        '구글 로그인 에러 발생',
        `코드: ${error.code}\n메시지: ${error.message}\nID: ${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'ID 없음'}`,
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
      const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
      if (cachedUser?.provider === 'GOOGLE') {
        if (__DEV__) console.log('📡 [AuthContext] 구글 세션 해제 시도 중...');
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          if (__DEV__) console.log('📡 [AuthContext] 구글 세션 해제 완료');
        } catch (e) {
          if (__DEV__) console.warn('구글 세션 해제 중 오류 (무시):', e);
        }
      }
    } finally {
      if (__DEV__) console.log('📡 [AuthContext] 로컬 토큰 삭제 및 상태 초기화 시작'); // 추가
      await removeToken();
      await removeRefreshToken();
      await removeData(STORAGE_KEYS.USER_INFO);
      setUserId(null);
      setUserEmail(null);
      setUserInfo(null);
      setNickname(null);
      setIsLoading(false);
      if (__DEV__) console.log('📡 [AuthContext] logout 완료 (상태 초기화됨)'); // 추가
    }
  }, [userId]);

  // 회원 탈퇴 함수
  const withdraw = useCallback(async () => {
    if (__DEV__) console.log('📡 [AuthContext] withdraw 함수 시작');
    setIsLoading(true);
    try {
      if (userId) {
        // 1. 백엔드에 회원 탈퇴 요청
        await authService.withdrawUser();
        if (__DEV__) console.log('📡 [AuthContext] 백엔드 회원 탈퇴 성공');

        // 2. 구글 연동 해제 (구글 유저만)
        const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
        if (cachedUser?.provider === 'GOOGLE') {
          try {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
          } catch (e) {
            console.warn('구글 세션 해제(revoke) 중 오류 (무시):', e);
          }
        }
      }

      // 3. 로컬 데이터 클리어 및 초기화
      if (__DEV__) console.log('📡 [AuthContext] 로컬 데이터 삭제 및 유저 리셋');

      if (userId) {
        await removeData(STORAGE_KEYS.NICKNAME(userId));
        await removeData(STORAGE_KEYS.KEYWORDS(userId));
        await removeData(STORAGE_KEYS.ACADEMIC_SOURCES(userId));
        await removeData(STORAGE_KEYS.BOOKMARK(userId));
        await removeData(STORAGE_KEYS.READ(userId));
        await removeData(STORAGE_KEYS.PUSH_SETTING(userId));
        await removeData(STORAGE_KEYS.MAP_FILTER(userId));
        await removeData(STORAGE_KEYS.FILTER_MODE(userId));
        await removeData(STORAGE_KEYS.GAME_SCORES(userId));
        await removeData(STORAGE_KEYS.PUSHED_NOTICES(userId));
      }

      await removeToken();
      await removeRefreshToken();
      await removeData(STORAGE_KEYS.USER_INFO);
      setUserId(null);
      setUserEmail(null);
      setUserInfo(null);
      setNickname(null);
      setGameBestScores({});
      if (__DEV__) console.log('✅ [AuthContext] 회원 탈퇴 프로세스 완료');
    } catch (error) {
      console.error('❌ [AuthContext] 회원 탈퇴 에러:', error);
      throw error; // 에러를 ProfileScreen으로 전달
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 토큰 갱신 실패 시 자동 로그아웃 콜백 등록
  useEffect(() => {
    setUnauthorizedCallback(() => {
      Alert.alert('알림', '세션이 만료되었습니다. 다시 로그인해 주세요.', [
        { text: '확인', onPress: () => logout() },
      ]);
    });
    return () => setUnauthorizedCallback(null);
  }, [logout]);

  // 닉네임 업데이트 함수
  const updateNickname = useCallback(
    async (name: string) => {
      if (!userId) return;
      try {
        await saveData(STORAGE_KEYS.NICKNAME(userId), name);
        setNickname(name);
        const cachedUser = await getData<any>(STORAGE_KEYS.USER_INFO);
        if (cachedUser) {
          await saveData(STORAGE_KEYS.USER_INFO, { ...cachedUser, nickname: name });
        }
      } catch (e) {
        if (__DEV__) console.error('❌ [AuthDebug] 닉네임 저장 중 에러:', e);
      }
    },
    [userId],
  );

  return (
    <AuthContext.Provider
      value={{
        userId,
        userEmail,
        userInfo,
        nickname,
        isAuthenticated: !!userId,
        isLoading,
        gameBestScores,
        updateGameBestScore,
        loginWithApple,
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
