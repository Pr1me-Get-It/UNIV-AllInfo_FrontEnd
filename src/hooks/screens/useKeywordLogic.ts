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
  const [academicSources, setAcademicSources] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userId, isAuthenticated } = useAuth();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const closeAlert = () => setAlertVisible(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [savedKeywords, savedAcademic] = await Promise.all([
        getData<string[]>(STORAGE_KEYS.KEYWORDS(userId)),
        getData<string[]>(STORAGE_KEYS.ACADEMIC_SOURCES(userId)),
      ]);
      setKeywords(savedKeywords ?? []);
      setAcademicSources(savedAcademic ?? []);
    } catch (error) {
      console.error('데이터 로딩 실패', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && userId) {
        fetchData();
      } else {
        setKeywords([]);
        setAcademicSources([]);
      }
    }, [isAuthenticated, userId, fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  const addKeyword = async (input: string | { label: string; value: string }) => {
    const raw = typeof input === 'object' ? input.value : input;
    const keyword = raw.trim();
    if (!keyword) {
      showAlert('입력 오류', '키워드를 입력해주세요.');
      return;
    }
    if (!userId) return;

    if (keywords.includes(keyword)) {
      showAlert('중복 키워드', '이미 등록된 키워드입니다.');
      return;
    }

    try {
      const updated = [...keywords, keyword];
      await saveData(STORAGE_KEYS.KEYWORDS(userId), updated);
      setKeywords(updated);
      setInputText('');
    } catch (error) {
      console.error('키워드 저장 실패', error);
      showAlert('오류', '키워드 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteKeyword = async (keyword: string) => {
    if (!userId) return;

    try {
      const updated = keywords.filter(k => k !== keyword);
      await saveData(STORAGE_KEYS.KEYWORDS(userId), updated);
      setKeywords(updated);
    } catch (error) {
      console.error('키워드 삭제 실패', error);
      showAlert('오류', '키워드 삭제 중 오류가 발생했습니다.');
    }
  };

  const addAcademicSource = async (code: string) => {
    if (!userId) return;

    if (academicSources.includes(code)) {
      showAlert('중복', '이미 등록된 학사 알림입니다.');
      return;
    }

    try {
      const updated = [...academicSources, code];
      await saveData(STORAGE_KEYS.ACADEMIC_SOURCES(userId), updated);
      setAcademicSources(updated);
    } catch (error) {
      console.error('학사 소스 저장 실패', error);
      showAlert('오류', '저장 중 오류가 발생했습니다.');
    }
  };

  const deleteAcademicSource = async (code: string) => {
    if (!userId) return;

    try {
      const updated = academicSources.filter(c => c !== code);
      await saveData(STORAGE_KEYS.ACADEMIC_SOURCES(userId), updated);
      setAcademicSources(updated);
    } catch (error) {
      console.error('학사 소스 삭제 실패', error);
      showAlert('오류', '삭제 중 오류가 발생했습니다.');
    }
  };

  const availableDepts = useMemo(() => {
    return Object.entries(SOURCE_LABELS)
      .filter(([code]) => !academicSources.includes(code))
      .map(([code, label]) => ({ code, label: label as string }));
  }, [academicSources]);

  return {
    isAuthenticated,
    loading,
    refreshing,
    keywords,
    academicSources,
    availableDepts,
    inputText,
    setInputText,
    alertVisible,
    alertTitle,
    alertMessage,
    onRefresh,
    addKeyword,
    deleteKeyword,
    addAcademicSource,
    deleteAcademicSource,
    closeAlert,
  };
};
