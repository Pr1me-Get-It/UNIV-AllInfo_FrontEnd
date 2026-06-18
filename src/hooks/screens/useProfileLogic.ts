import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { registerForPushNotificationsAsync } from '../../utils/notifications';
import { saveData, getData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { isValidNickname } from '../../utils/filter';
import { sendFeedback } from '../../api/feedbackService';
import { notificationService } from '../../api/notificationService';
import * as appleAuthentication from 'expo-apple-authentication';

export function useProfileLogic() {
  const {
    userId,
    userEmail,
    userInfo,
    nickname,
    isAuthenticated,
    loginWithApple,
    loginWithGoogle,
    logout,
    withdraw,
    updateNickname,
    isLoading,
  } = useAuth();

  // apple 로그인 관련 상태
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  useEffect(() => {
    const checkAppleAuthAvailable = async () => {
      const available = await appleAuthentication.isAvailableAsync();
      setIsAppleAuthAvailable(available);
    };
    checkAppleAuthAvailable();
  }, []);

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
    }, [isLoading, isAuthenticated, nickname, userInfo]),
  );

  const [pushEnabled, setPushEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  // 커스텀 알림 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [alertButtons, setAlertButtons] = useState<any[] | undefined>(undefined);

  const showAlert = useCallback(
    (title: string, message: string, onConfirm?: () => void, buttons?: any[]) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertOnConfirm(() => onConfirm);
      setAlertButtons(buttons);
      setAlertVisible(true);
    },
    [],
  );

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
    const input = feedbackInput.trim();
    if (!input) {
      showAlert('오류', '피드백 내용을 입력해주세요.');
      return;
    }
    setIsSendingFeedback(true);
    try {
      await sendFeedback(input);
      setIsFeedbackModalVisible(false);
      setFeedbackInput('');
      showAlert('감사합니다', '피드백이 전송되었습니다 :)');
    } catch (e) {
      showAlert('오류', '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleLogout = () => {
    showAlert('로그아웃', '로그아웃 하시겠습니까?', () => {
      setPushEnabled(false);
      logout();
    });
  };

  useEffect(() => {
    const loadPushSetting = async () => {
      if (userId) {
        const savedSetting = await getData(STORAGE_KEYS.PUSH_SETTING(userId));
        if (savedSetting !== null) setPushEnabled(savedSetting === 'true');
      } else {
        setPushEnabled(false);
      }
    };
    loadPushSetting();
  }, [userId]);

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

    if (userId) {
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

  const handleAppleLogin = async () => {
    try {
      await loginWithApple();
    } catch (e) {
      showAlert('로그인 오류', '애플 로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.');
    }
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

    if (userId) await saveData(STORAGE_KEYS.PUSH_SETTING(userId), String(value));

    if (value) {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await notificationService.setExpoTokenActive(token, true);
          showAlert('알림', '푸시 알림 설정이 완료되었습니다.');
        } else {
          showAlert('오류', '푸시 토큰을 가져올 수 없습니다.');
          setPushEnabled(false);
          if (userId) await saveData(STORAGE_KEYS.PUSH_SETTING(userId), 'false');
        }
      } catch (e) {
        console.error('🚀 [PushDebug] 에러 발생:', e);
        setPushEnabled(false);
        if (userId) await saveData(STORAGE_KEYS.PUSH_SETTING(userId), 'false');
        showAlert('오류', '푸시 알림 설정 중 문제가 발생했습니다.');
      }
    } else {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) await notificationService.setExpoTokenActive(token, false);
      } catch (e) {
        if (__DEV__) console.warn('푸시 토큰 비활성화 실패 (무시):', e);
      }
    }
  };

  return {
    userEmail,
    userInfo,
    nickname,
    isAuthenticated,
    isNicknameModalVisible,
    setIsNicknameModalVisible,
    nicknameInput,
    setNicknameInput,
    isForcedNickname,
    setIsForcedNickname,
    pushEnabled,
    marketingEnabled,
    setMarketingEnabled,
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
    handleLogout,
    handleNicknameSave,
    handleWithdraw,
    isAppleAuthAvailable,
    handleAppleLogin,
    handleGoogleLogin,
    handlePushToggle,
  };
}
