import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Animated, Linking, Alert, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { AVAILABLE_LINKS, ExternalLink } from '../../constants/links';
import { isValidNickname } from '../../utils/filter';
import academicSchedule from '../../constants/academic_schedule.json';
import { sendFeedback } from '../../api/feedbackService';

// 피드백 보내기 제한 상수 설정
const FEEDBACK_LIMIT_KEY = 'feedback_timestamps';
const MAX_LIMIT = 3; // 10분동안 최대 3번
const TIME_WINDOW = 10 * 60 * 1000; // 10분

export function useHomeLogic(navigation: any) {
  const { nickname, userInfo, isAuthenticated, updateNickname } = useAuth();
  const [customLinks, setCustomLinks] = useState<ExternalLink[]>(AVAILABLE_LINKS.slice(0, 4));

  // 닉네임 모달 상태
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  // 검색 상태
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 피드백 관련 상태
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // 커스텀 알림 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [alertButtons, setAlertButtons] = useState<any[] | undefined>(undefined);

  // 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 통합 검색 인덱스 정의
  const searchIndex = useMemo(() => {
    const internalFeatures = [
      { id: 'map', title: '학교 지도', type: 'internal', screen: 'Map', icon: 'map' },
      {
        id: 'applegame',
        title: '두쫀쿠게임',
        type: 'internal',
        screen: 'AppleGame',
        icon: 'nutrition',
      },
      {
        id: 'flappybird',
        title: '플래피 버드',
        type: 'internal',
        screen: 'FlappyBird',
        icon: 'rocket',
      },
      {
        id: 'keyword',
        title: '키워드 알림 설정',
        type: 'internal',
        screen: 'Keyword',
        icon: 'notifications-outline',
      },
      {
        id: 'bookmark',
        title: '즐겨찾기(북마크)',
        type: 'internal',
        screen: 'Bookmark',
        icon: 'bookmark-outline',
      },
    ];

    const profileSettings = [
      {
        id: 'push_setting',
        title: '푸시 알림 설정',
        type: 'internal',
        screen: 'Profile',
        icon: 'notifications',
      },
      {
        id: 'sound_setting',
        title: '알림 소리 설정',
        type: 'internal',
        screen: 'Profile',
        icon: 'volume-high',
      },
      {
        id: 'feedback',
        title: '피드백 보내기',
        type: 'internal',
        screen: 'Profile',
        icon: 'mail-unread',
      },
      {
        id: 'license',
        title: '오픈소스 라이선스',
        type: 'internal',
        screen: 'Profile',
        icon: 'document-text',
      },
      {
        id: 'nickname_setting',
        title: '닉네임 변경',
        type: 'action',
        action: 'nickname',
        icon: 'person-outline',
      },
      { id: 'logout', title: '로그아웃', type: 'internal', screen: 'Profile', icon: 'log-out' },
    ];

    const externalLinks = AVAILABLE_LINKS.map(link => ({
      ...link,
      type: 'external',
    }));

    const academicEvents = academicSchedule.map((event: any) => ({
      id: event.id,
      title: `[학사일정] ${event.summary}`,
      type: 'academic',
      date: event.start.date || event.start.dateTime?.split('T')[0],
      icon: 'calendar',
    }));

    return [...internalFeatures, ...profileSettings, ...externalLinks, ...academicEvents];
  }, []);

  // 실시간 검색 결과 필터링
  useEffect(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const filtered = searchIndex
      .filter(item => item.title.toLowerCase().includes(query))
      .slice(0, 8);

    setSearchResults(filtered);
  }, [searchText, searchIndex]);

  // 커스텀 알림 함수
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

  // 닉네임 수정 핸들러
  const handleNicknamePress = useCallback(() => {
    if (!isAuthenticated) {
      showAlert('로그인 필요', '로그인이 필요합니다.', () => {
        navigation.navigate('Profile');
      });
      return;
    }
    setNicknameInput(nickname || userInfo?.name || '');
    setIsNicknameModalVisible(true);
  }, [isAuthenticated, nickname, userInfo, navigation, showAlert]);

  // 검색 결과 클릭 핸들러
  const handleSearchResultPress = useCallback(
    (item: any) => {
      setSearchText('');
      setSearchResults([]);

      if (item.type === 'external') {
        handleOpenLink(item.url);
      } else if (item.type === 'internal') {
        if (item.screen === 'Map') {
          navigation.navigate('MainTab', { screen: 'Map' } as any);
        } else {
          navigation.navigate(item.screen as any);
        }
      } else if (item.type === 'academic') {
        navigation.navigate('MainTab', {
          screen: 'Calendar',
          params: { initialDate: item.date },
        } as any);
      } else if (item.type === 'action') {
        if (item.action === 'nickname') {
          handleNicknamePress();
        }
      }
    },
    [navigation, handleNicknamePress],
  );

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

    if (isAuthenticated) {
      await updateNickname(input);
      setIsNicknameModalVisible(false);
      setNicknameInput('');
      showAlert('알림', '닉네임이 성공적으로 변경되었습니다.');
    }
  };

  const handleFeedbackSubmit = async () => {
    const { allowed, remainingTime } = await checkFeedbackLimit();

    if (!allowed) {
      Alert.alert(
        '알림',
        `\n짧은 시간에 너무 많은 피드백을 보내실 수 없습니다.\n잠시후 다시 시도해주세요.\n\n남은 시간: ${remainingTime}분`,
      );
      return;
    }

    if (!feedbackInput.trim()) {
      // 커스텀 alert 사용 시 터치 이벤트를 못 잡는 경우가 있음
      // 네이티브 alert로 사용
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }

    setIsSendingFeedback(true);
    Keyboard.dismiss();
    try {
      await sendFeedback(feedbackInput);
      setIsFeedbackModalVisible(false);
      setFeedbackInput('');
      showAlert('감사합니다', '소중한 의견이 전달되었습니다. 🙇‍♂️');
    } catch (error: any) {
      console.error('[Feedback] 전송 실패 ❌', error?.response?.data ?? error?.message ?? error);
      // 네이티브 alert로 사용
      Alert.alert('전송 실패', '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadLinks = async () => {
        try {
          const stored = await AsyncStorage.getItem('CUSTOM_LINKS');
          if (stored) {
            const ids = JSON.parse(stored) as string[];
            const filtered = ids
              .map(id => AVAILABLE_LINKS.find(link => link.id === id))
              .filter(Boolean) as ExternalLink[];
            setCustomLinks(filtered);
          } else {
            setCustomLinks(AVAILABLE_LINKS.slice(0, 4));
          }
        } catch (error) {
          console.error('Failed to load custom links on home', error);
        }
      };
      loadLinks();
    }, []),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000, // 1 second fade-in
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('에러', '연결할 수 없는 링크입니다.');
      }
    } catch (error) {
      if (__DEV__) console.error('An error occurred', error);
    }
  };

  const handleSearchSubmit = useCallback(() => {
    const trimmedQuery = searchText.trim();
    if (trimmedQuery) {
      navigation.navigate('MainTab', {
        screen: 'Notice',
        params: { initialQuery: trimmedQuery },
      } as any);
      setSearchText('');
    }
  }, [searchText, navigation]);

  return {
    nickname,
    customLinks,
    isNicknameModalVisible,
    setIsNicknameModalVisible,
    nicknameInput,
    setNicknameInput,
    searchText,
    setSearchText,
    searchResults,
    setSearchResults,
    isFeedbackModalVisible,
    setIsFeedbackModalVisible,
    feedbackInput,
    setFeedbackInput,
    isSendingFeedback,
    alertVisible,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    alertButtons,
    closeAlert,
    fadeAnim,
    handleSearchResultPress,
    handleNicknamePress,
    handleNicknameSave,
    handleFeedbackSubmit,
    handleOpenLink,
    handleSearchSubmit,
  };
}

const checkFeedbackLimit = async (): Promise<{
  allowed: boolean;
  remainingTime: number;
}> => {
  const now = Date.now();

  const storedData = await AsyncStorage.getItem(FEEDBACK_LIMIT_KEY);
  let timestamps: number[] = storedData ? JSON.parse(storedData) : [];
  timestamps = timestamps.filter(timestamp => now - timestamp <= TIME_WINDOW);

  if (timestamps.length >= MAX_LIMIT) {
    return {
      allowed: false,
      remainingTime: Math.ceil((TIME_WINDOW - (now - timestamps[0])) / 1000 / 60),
    };
  }

  timestamps.push(now);
  await AsyncStorage.setItem(FEEDBACK_LIMIT_KEY, JSON.stringify(timestamps));

  return { allowed: true, remainingTime: 0 };
};
