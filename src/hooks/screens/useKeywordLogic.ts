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
    // input이 { label, value } 객체(인기 키워드 칩)인 경우와 문자열(직접 입력)인 경우 모두 처리
    const keyword: string =
      typeof input === 'object' && input !== null
        ? (input.value ?? '').trim()
        : String(input ?? '').trim();

    if (!keyword) {
      showAlert('입력 오류', '키워드를 입력해주세요.');
      return;
    }

    if (!userEmail) return;
    const safeEmail = userEmail.replace(/\./g, '_');

    // SOURCE_LABELS의 키(코드) 또는 값(학부/공통 명칭)과 일치하는지 검사
    let matchedCode: string | null = null;
    const lowerKeyword = keyword.toLowerCase();

    // 1. 키(예: "cse", "news")와 직접 일치하는지 검사
    const foundKey = Object.keys(SOURCE_LABELS).find(
      key => key.toLowerCase() === lowerKeyword
    );
    if (foundKey) {
      matchedCode = foundKey;
    } else {
      // 2. 값(예: "컴퓨터학부", "경북대학교공지")과 일치하는지 검사
      const foundEntry = Object.entries(SOURCE_LABELS).find(
        ([_, val]) => (val as string).toLowerCase() === lowerKeyword
      );
      if (foundEntry) {
        matchedCode = foundEntry[0];
      }
    }

    const finalKeyword = matchedCode || keyword;

    // 이미 등록된 키워드인지 확인
    if (keywords.includes(finalKeyword)) {
      showAlert('중복 키워드', '이미 등록된 키워드입니다.');
      return;
    }

    try {
      const updatedKeywords = [...keywords, finalKeyword];
      await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), updatedKeywords);
      setKeywords(updatedKeywords);
      setInputText(''); // 직접 입력창 초기화
    } catch (error) {
      console.error('키워드 저장 실패', error);
      showAlert('오류', '키워드 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteKeyword = async (keywordToDelete: string) => {
    if (!userEmail) return;
    const safeEmail = userEmail.replace(/\./g, '_');

    try {
      const updatedKeywords = keywords.filter(k => k !== keywordToDelete);
      await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), updatedKeywords);
      setKeywords(updatedKeywords);
    } catch (error) {
      console.error('키워드 삭제 실패', error);
      showAlert('오류', '키워드 삭제 중 오류가 발생했습니다.');
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
