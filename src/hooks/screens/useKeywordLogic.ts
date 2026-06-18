import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';
import { getData, saveData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import SOURCE_LABELS from '../../constants/labeltag.json';
import { notificationService } from '../../api/notificationService';

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

  const [pushStatus, setPushStatus] = useState<'enabled' | 'app_disabled' | 'system_disabled'>('enabled');

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
      // 백엔드에서 최신 구독 목록 가져와 로컬과 동기화
      const [keywordsRes, sourcesRes] = await Promise.all([
        notificationService.getKeywords(),
        notificationService.getSources(),
      ]);
      const serverKeywords = keywordsRes.data ?? [];
      const serverSources = sourcesRes.data ?? [];

      await saveData(STORAGE_KEYS.KEYWORDS(userId), serverKeywords);
      await saveData(STORAGE_KEYS.ACADEMIC_SOURCES(userId), serverSources);
      setKeywords(serverKeywords);
      setAcademicSources(serverSources);
    } catch (error) {
      // 네트워크 실패 시 로컬 캐시로 폴백
      console.error('백엔드 동기화 실패, 로컬 캐시 사용:', error);
      const [savedKeywords, savedAcademic] = await Promise.all([
        getData<string[]>(STORAGE_KEYS.KEYWORDS(userId)),
        getData<string[]>(STORAGE_KEYS.ACADEMIC_SOURCES(userId)),
      ]);
      setKeywords(savedKeywords ?? []);
      setAcademicSources(savedAcademic ?? []);
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

      // 푸시 알림 상태 체크 (화면 포커스마다)
      const checkPushStatus = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          setPushStatus('system_disabled');
          return;
        }
        if (userId) {
          const appSetting = await getData<string>(STORAGE_KEYS.PUSH_SETTING(userId));
          setPushStatus(appSetting === 'false' ? 'app_disabled' : 'enabled');
        } else {
          setPushStatus('enabled');
        }
      };
      checkPushStatus();
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
      const res = await notificationService.addKeywords([keyword]);
      console.log('[ADD] 키워드 추가 응답:', res.status, res.data);
      const updated = [...keywords, keyword];
      await saveData(STORAGE_KEYS.KEYWORDS(userId), updated);
      setKeywords(updated);
      setInputText('');
    } catch (error: any) {
      console.error('[ADD] 키워드 저장 실패 - status:', error?.response?.status, 'data:', error?.response?.data);
      showAlert('오류', '키워드 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteKeyword = async (keyword: string) => {
    if (!userId) return;

    try {
      console.log('[DELETE] 키워드 삭제 요청:', keyword);
      const res = await notificationService.deleteKeywords([keyword]);
      console.log('[DELETE] 키워드 삭제 응답:', res.status, res.data);
      const updated = keywords.filter(k => k !== keyword);
      await saveData(STORAGE_KEYS.KEYWORDS(userId), updated);
      setKeywords(updated);
    } catch (error: any) {
      console.error('[DELETE] 키워드 삭제 실패 - status:', error?.response?.status, 'data:', error?.response?.data);
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
      await notificationService.addSources([code]);
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
      await notificationService.deleteSources([code]);
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
    pushStatus,
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
