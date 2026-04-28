import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Animated, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { AVAILABLE_LINKS, ExternalLink } from '../../constants/links';
import { isValidNickname } from '../../utils/filter';
import academicSchedule from '../../constants/academic_schedule.json';

export function useHomeLogic(navigation: any) {
  const { nickname, userInfo, isAuthenticated, updateNickname } = useAuth();
  const [customLinks, setCustomLinks] = useState<ExternalLink[]>(AVAILABLE_LINKS.slice(0, 4));

  // 닉네임 모달 상태
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  
  // 검색 상태
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

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
      { id: 'applegame', title: '두쫀쿠게임', type: 'internal', screen: 'AppleGame', icon: 'nutrition' },
      { id: 'flappybird', title: '플래피 버드', type: 'internal', screen: 'FlappyBird', icon: 'rocket' },
      { id: 'keyword', title: '키워드 알림 설정', type: 'internal', screen: 'Keyword', icon: 'notifications-outline' },
      { id: 'bookmark', title: '즐겨찾기(북마크)', type: 'internal', screen: 'Bookmark', icon: 'bookmark-outline' },
    ];

    const profileSettings = [
      { id: 'push_setting', title: '푸시 알림 설정', type: 'internal', screen: 'Profile', icon: 'notifications' },
      { id: 'sound_setting', title: '알림 소리 설정', type: 'internal', screen: 'Profile', icon: 'volume-high' },
      { id: 'feedback', title: '피드백 보내기', type: 'internal', screen: 'Profile', icon: 'mail-unread' },
      { id: 'license', title: '오픈소스 라이선스', type: 'internal', screen: 'Profile', icon: 'document-text' },
      { id: 'nickname_setting', title: '닉네임 변경', type: 'action', action: 'nickname', icon: 'person-outline' },
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

    const filtered = searchIndex.filter(item =>
      item.title.toLowerCase().includes(query)
    ).slice(0, 8);

    setSearchResults(filtered);
  }, [searchText, searchIndex]);

  // 커스텀 알림 함수
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
  const handleSearchResultPress = useCallback((item: any) => {
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
        params: { initialDate: item.date }
      } as any);
    } else if (item.type === 'action') {
      if (item.action === 'nickname') {
        handleNicknamePress();
      }
    }
  }, [navigation, handleNicknamePress]);

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
        params: { initialQuery: trimmedQuery }
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
    handleOpenLink,
    handleSearchSubmit,
  };
}
