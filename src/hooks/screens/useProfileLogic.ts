import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../api/userService';
import { registerForPushNotificationsAsync } from '../../utils/notifications';
import { saveData, getData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { isValidNickname } from '../../utils/filter';
import { sendFeedback } from '../../api/feedbackService';

const DEV_PASSWORD = '1557';

export function useProfileLogic() {
  const {
    userEmail,
    userInfo,
    nickname,
    isAuthenticated,
    loginWithGoogle,
    loginDev,
    logout,
    withdraw,
    updateNickname,
    isLoading,
  } = useAuth();

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // 닉네임 관련 상태
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isForcedNickname, setIsForcedNickname] = useState(false);

  // Focus 시점에 닉네임 여부 검사
  useFocusEffect(
    useCallback(() => {
      if (!isLoading && isAuthenticated && nickname === null && userInfo !== null) {
        setIsForcedNickname(true);
        setIsNicknameModalVisible(true);
      } else {
        setIsForcedNickname(false);
      }
    }, [isLoading, isAuthenticated, nickname, userInfo])
  );

  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightPushOnly, setNightPushOnly] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [devClickCount, setDevClickCount] = useState(0);

  // 커스텀 알림 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [alertButtons, setAlertButtons] = useState<any[] | undefined>(undefined);

  const showAlert = useCallback((title: string, message: string, onConfirm?: () => void, buttons?: any[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setAlertButtons(buttons);
    setAlertVisible(true);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertVisible(false);
    setAlertOnConfirm(undefined);
    setAlertButtons(undefined);
  }, []);

  // 피드백 관련 상태
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // 라이선스 모달 상태
  const [isLicenseModalVisible, setIsLicenseModalVisible] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackInput.trim()) {
      showAlert('알림', '내용을 입력해주세요.');
      return;
    }

    setIsSendingFeedback(true);
    try {
      await sendFeedback(feedbackInput);
      setIsFeedbackModalVisible(false);
      setFeedbackInput('');
      showAlert('감사합니다', '소중한 의견이 전달되었습니다. 🙇‍♂️');
    } catch (error: any) {
      console.error('[Feedback] 전송 실패 ❌', error?.response?.data ?? error?.message ?? error);
      showAlert('전송 실패', '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handlePasswordSubmit = () => {
    if (passwordInput === DEV_PASSWORD) {
      setIsPasswordModalVisible(false);
      setPasswordInput('');

      showAlert('테스트 계정 선택', '로그인할 테스트 계정을 선택해주세요.', undefined, [
        {
          text: 'Test 1 (기본)',
          onPress: () => loginDev(),
          style: 'default',
        },
        {
          text: 'Test 2 (추가)',
          onPress: () => loginDev('test2@knu.ac.kr'),
          style: 'default',
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]);
    } else {
      showAlert('오류', '비밀번호가 틀렸습니다.');
    }
  };

  const handleLogout = () => {
    showAlert('로그아웃', '로그아웃 하시겠습니까?', () => {
      setPushEnabled(false);
      logout();
    });
  };

  useEffect(() => {
    const loadPushSetting = async () => {
      if (userEmail) {
        const safeEmail = userEmail.replace(/\./g, '_');
        const savedSetting = await getData(STORAGE_KEYS.PUSH_SETTING(safeEmail));
        if (savedSetting !== null) {
          setPushEnabled(savedSetting === 'true');
        }
      } else {
        setPushEnabled(false);
      }
    };
    loadPushSetting();
  }, [userEmail]);

  const handleNicknameSave = async () => {
    const input = nicknameInput.trim();
    if (!input) {
      showAlert('오류', '닉네임을 입력해주세요.');
      return;
    }

    if (!isValidNickname(input)) {
      showAlert('부적절한 닉네임', '비속어나 제한된 단어가 포함되어 있습니다.');
      return;
    }

    if (userEmail) {
      await updateNickname(input);
      setIsNicknameModalVisible(false);
      setNicknameInput('');
      showAlert('알림', '닉네임이 설정되었습니다.');
    }
  };

  const handleWithdraw = () => {
    showAlert('회원 탈퇴', '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.', async () => {
      try {
        await withdraw();
        showAlert('알림', '회원 탈퇴가 완료되었습니다.');
      } catch (error) {
        showAlert('오류', '회원 탈퇴 처리에 실패했습니다.\n잠시 후 다시 시도해주세요.');
      }
    });
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      showAlert('로그인 오류', '구글 로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.');
    }
  };

  const handlePushToggle = async (value: boolean) => {
    if (!isAuthenticated) {
      showAlert('로그인 필요', '푸시 알림을 받으려면 로그인이 필요합니다.');
      setPushEnabled(false);
      return;
    }

    setPushEnabled(value);

    if (userEmail) {
      const safeEmail = userEmail.replace(/\./g, '_');
      await saveData(STORAGE_KEYS.PUSH_SETTING(safeEmail), String(value));
    }

    if (value) {
      try {
        const token = await registerForPushNotificationsAsync();

        if (token) {
          try {
            await registerUser(userEmail!, token);
          } catch (apiError: any) {
            if (__DEV__) console.warn('🔔 [PushDebug] registerUser 실패 (무시):', apiError?.response?.status || apiError?.message);
          }
          showAlert('알림', '푸시 알림 설정이 완료되었습니다.');
        } else {
          showAlert('오류', '푸시 토큰을 가져올 수 없습니다.');
          setPushEnabled(false);
          if (userEmail) {
            const safeEmail = userEmail.replace(/\./g, '_');
            await saveData(STORAGE_KEYS.PUSH_SETTING(safeEmail), 'false');
          }
        }
      } catch (e) {
        console.error('🚀 [PushDebug] 에러 발생:', e);
        setPushEnabled(false);
        if (userEmail) {
          const safeEmail = userEmail.replace(/\./g, '_');
          await saveData(STORAGE_KEYS.PUSH_SETTING(safeEmail), 'false');
        }
        showAlert('오류', '푸시 알림 설정 중 문제가 발생했습니다.');
      }
    }
  };

  return {
    userEmail,
    userInfo,
    nickname,
    isAuthenticated,
    isPasswordModalVisible,
    setIsPasswordModalVisible,
    passwordInput,
    setPasswordInput,
    isNicknameModalVisible,
    setIsNicknameModalVisible,
    nicknameInput,
    setNicknameInput,
    isForcedNickname,
    setIsForcedNickname,
    pushEnabled,
    soundEnabled,
    setSoundEnabled,
    nightPushOnly,
    setNightPushOnly,
    marketingEnabled,
    setMarketingEnabled,
    devClickCount,
    setDevClickCount,
    alertVisible,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    alertButtons,
    closeAlert,
    showAlert,
    isFeedbackModalVisible,
    setIsFeedbackModalVisible,
    feedbackInput,
    setFeedbackInput,
    isSendingFeedback,
    isLicenseModalVisible,
    setIsLicenseModalVisible,
    appVersion,
    handleFeedbackSubmit,
    handlePasswordSubmit,
    handleLogout,
    handleNicknameSave,
    handleWithdraw,
    handleGoogleLogin,
    handlePushToggle,
  };
}
