import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { syncKeywords, deleteUserKeyword } from '../../api/userService';
import { getData, saveData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import SOURCE_LABELS from '../../constants/labeltag.json';

export const POPULAR_KEYWORDS = [
  { label: '장학', value: '장학' },
  { label: '공모전', value: '공모전' },
  { label: '인턴', value: '인턴' },
  { label: '채용', value: '채용' },
  { label: '특강', value: '특강' },
  { label: '휴강', value: '휴강' },
  { label: '봉사', value: '봉사' },
  { label: '교환학생', value: '교환학생' },
];

export const useKeywordLogic = () => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userEmail, isAuthenticated } = useAuth();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  const fetchKeywords = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);

    const safeEmail = userEmail.replace(/\./g, '_');

    try {
      const localKeywords = await getData(STORAGE_KEYS.KEYWORDS(safeEmail));

      if (localKeywords && Array.isArray(localKeywords)) {
        setKeywords(localKeywords);
      } else {
        setKeywords([]);
      }
    } catch (error) {
      console.error('키워드 로컬 로딩 실패', error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && userEmail) {
        fetchKeywords();
      } else {
        setKeywords([]);
      }
    }, [isAuthenticated, userEmail, fetchKeywords]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userEmail) {
      fetchKeywords().finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [userEmail, fetchKeywords]);

  const addKeyword = async (input: any) => {
    const keywordToAdd = typeof input === 'object' ? input.value : input;

    if (!keywordToAdd || !keywordToAdd.trim()) return;

    const trimmedKeyword = keywordToAdd.trim();

    if (Array.isArray(keywords) && keywords.includes(trimmedKeyword)) {
      showAlert('알림', '이미 등록된 키워드입니다.');
      return;
    }

    const prevKeywords = [...keywords];
    const newKeywords = [...prevKeywords, trimmedKeyword];

    setKeywords(newKeywords);
    setInputText('');

    if (userEmail) {
      const safeEmail = userEmail.replace(/\./g, '_');
    }

    try {
      const response = await syncKeywords(userEmail, newKeywords);

      if (response.data && response.data.success) {
        const serverKeywords = response.data.keywords;
        if (serverKeywords && serverKeywords.length > 0) {
          setKeywords(serverKeywords);
          const safeEmail = userEmail.replace(/\./g, '_');
          await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), serverKeywords);
        }
      } else {
        throw new Error('Server indicated failure');
      }
    } catch (error) {
      console.error(`❌ [추가 에러]`, error);
      setKeywords(prevKeywords);
      if (userEmail) {
        const safeEmail = userEmail.replace(/\./g, '_');
        await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), prevKeywords);
      }
      showAlert('오류', '서버 문제로 키워드를 추가할 수 없습니다.');
    }
  };

  const deleteKeyword = async (keywordToDelete: string) => {
    if (!userEmail) return;

    if ((SOURCE_LABELS as any)[keywordToDelete]) {
      showAlert('알림', '학과 키워드는 [공지사항 필터]에서 해제해주세요.');
      return;
    }

    const prevKeywords = [...keywords];
    const newKeywords = keywords.filter(k => k !== keywordToDelete);

    setKeywords(newKeywords);

    const safeEmail = userEmail.replace(/\./g, '_');
    await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), newKeywords);

    try {
      const response = await deleteUserKeyword(userEmail, keywordToDelete);

      if (response.data.success) {
        if (response.data.keywords) {
          setKeywords(response.data.keywords);
          await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), response.data.keywords);
        }
      } else {
        setKeywords(prevKeywords);
        await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), prevKeywords);
        showAlert('오류', '키워드 삭제 실패');
      }
    } catch (e) {
      setKeywords(prevKeywords);
      await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), prevKeywords);
      showAlert('오류', '네트워크 오류로 삭제 실패');
    }
  };

  const sortedKeywords = useMemo(() => {
    const deptKeys = Object.keys(SOURCE_LABELS);

    const deptKeywords = keywords.filter(k => (SOURCE_LABELS as any)[k]);
    const manualKeywords = keywords.filter(k => !(SOURCE_LABELS as any)[k]);

    deptKeywords.sort((a, b) => {
      return deptKeys.indexOf(a) - deptKeys.indexOf(b);
    });

    return [...deptKeywords, ...manualKeywords];
  }, [keywords]);

  return {
    isAuthenticated,
    loading,
    refreshing,
    sortedKeywords,
    inputText,
    setInputText,
    alertVisible,
    alertTitle,
    alertMessage,
    onRefresh,
    addKeyword,
    deleteKeyword,
    closeAlert,
  };
};
