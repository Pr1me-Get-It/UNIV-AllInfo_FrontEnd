import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
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
    showAlert('준비중', '백엔드 개편으로 인해 준비중인 기능입니다.');
  };

  const deleteKeyword = async (keywordToDelete: string) => {
    showAlert('준비중', '백엔드 개편으로 인해 준비중인 기능입니다.');
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
