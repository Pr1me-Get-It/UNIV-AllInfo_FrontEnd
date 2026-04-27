import { useState, useContext, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { AlarmContext } from '../../data/Alarm';
import { api } from '../../api/client';
import { getToken } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import SOURCE_LABELS from '../../constants/labeltag.json';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

export const DEV_TOKEN = 'DEV_MODE_ACCESS_TOKEN';

export const stripHtml = (text: string) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return null;
  return dateStr.split('T')[0];
};

type DetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export const useDetailLogic = (route: DetailScreenRouteProp, navigation: DetailScreenNavigationProp) => {
  const params = route.params || { item: null };
  const item = params.item || null;
  const context = useContext(AlarmContext);
  const { markAsRead, toggleBookmark, bookmarkStatus, addMockEvent } = context || {};
  const { isAuthenticated } = useAuth();
  
  const itemId = item ? item.notice_id || item.id : null;
  const sourcePrefix = item?.source ? item.source.split('/')[0] : '';
  const displaySource = SOURCE_LABELS[sourcePrefix as keyof typeof SOURCE_LABELS] || item?.source || '출처 없음';

  const isBookmarked = bookmarkStatus && itemId ? !!bookmarkStatus[itemId] : false;
  const [likeCount, setLikeCount] = useState(item?.like || 0);

  const [deadlineInfo, setDeadlineInfo] = useState<any>(null);
  const [loadingDeadline, setLoadingDeadline] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [alertButtons, setAlertButtons] = useState<any[] | undefined>(undefined);

  const showAlert = (title: string, message: string, onConfirm?: () => void, buttons?: any[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setAlertButtons(buttons);
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
    setAlertOnConfirm(undefined);
    setAlertButtons(undefined);
  };

  useEffect(() => {
    if (!item || !itemId || !markAsRead) return;
    markAsRead(itemId, true);
    fetchDeadline();
  }, [item, itemId, markAsRead]);

  const fetchDeadline = async () => {
    if (!itemId) return;
    setLoadingDeadline(true);
    try {
      const response = await api.get(`/notice/${itemId}/deadline`);
      if (response.data && (response.data.deadline || response.data.kickoff)) {
        setDeadlineInfo(response.data);
      } else {
        setDeadlineInfo(null);
      }
    } catch (e) {
      console.log('마감일 조회 실패 (없을 수 있음):', e);
      setDeadlineInfo(null);
    } finally {
      setLoadingDeadline(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      showAlert(
        '로그인 필요',
        '북마크 기능은 로그인이 필요합니다.',
        undefined,
        [
          { text: '닫기', style: 'cancel' },
          {
            text: '로그인 하러가기',
            onPress: () => navigation.navigate('Profile'),
          },
        ]
      );
      return;
    }

    if (toggleBookmark) {
      toggleBookmark(item);
      if (isBookmarked) {
        setLikeCount((prev: number) => Math.max(0, prev - 1));
      } else {
        setLikeCount((prev: number) => prev + 1);
      }
    }
  };

  const handleMarkUnread = () => {
    if (markAsRead) {
      markAsRead(item.id, false);
      navigation.goBack();
    }
  };

  const openLink = () => {
    if (item?.link) {
      Linking.openURL(item.link).catch(err => console.error('링크 열기 실패', err));
    }
  };

  const addToCalendar = async () => {
    if (!deadlineInfo) return;

    if (!isAuthenticated) {
      showAlert(
        '로그인 필요',
        '캘린더에 등록하려면 로그인이 필요합니다.',
        undefined,
        [
          { text: '닫기', style: 'cancel' },
          {
            text: '로그인 하러가기',
            onPress: () => navigation.navigate('Profile'),
          },
        ]
      );
      return;
    }

    try {
      const token = await getToken();

      if (token === DEV_TOKEN) {
        const newEvent = {
          id: `dev-${Date.now()}`,
          summary: `[개발] ${item.title}`,
          location: item.source,
          start: {
            date: deadlineInfo.end || deadlineInfo.start,
          },
        };
        if (addMockEvent) addMockEvent(newEvent);
        Alert.alert('성공', '개발자용 캘린더에 등록되었습니다.');
        return;
      }

      const startDate = (deadlineInfo.kickoff || deadlineInfo.deadline)?.split('T')[0];
      const endDate = (deadlineInfo.deadline || deadlineInfo.kickoff)?.split('T')[0];

      const event = {
        summary: item.title,
        description: `참조링크 : ${item.link}`,
        start: {
          date: startDate,
        },
        end: {
          date: endDate,
        },
      };
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        },
      );

      if (response.ok) {
        Alert.alert('성공', '구글 캘린더에 일정이 등록되었습니다!');
      } else {
        Alert.alert('실패', '캘린더 등록 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.error('[Calendar Debug] Error:', e);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  return {
    item,
    displaySource,
    isBookmarked,
    likeCount,
    deadlineInfo,
    loadingDeadline,
    alertVisible,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    alertButtons,
    closeAlert,
    handleLikeToggle,
    handleMarkUnread,
    openLink,
    addToCalendar,
  };
};
