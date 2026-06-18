import { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { AlarmContext } from '../../data/Alarm';
import { useAuth } from '../../context/AuthContext';
import SOURCE_LABELS from '../../constants/labeltag.json';
import { getData, saveData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { fetchNotices } from '../../api/noticeService';

export function useNoticeLogic(navigation: any, route: any) {
  const { isAuthenticated } = useAuth();
  const alarmContext = useContext(AlarmContext);
  const readStatus = alarmContext ? alarmContext.readStatus : {};
  const markMultipleAsRead = alarmContext?.markMultipleAsRead;
  const clearPushedNotices = alarmContext?.clearPushedNotices;
  const addPushedNotice = alarmContext?.addPushedNotice;
  const pushedNoticeIds = alarmContext?.pushedNoticeIds ?? [];
  const safeStatus = readStatus || {};

  const [query, setQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [tempSelectedSources, setTempSelectedSources] = useState<string[]>([]);
  const [isCommonExpanded, setIsCommonExpanded] = useState(false);
  const [isDeptExpanded, setIsDeptExpanded] = useState(false);

  // Date Range, Sort State
  const [dateRange, setDateRange] = useState('1m'); // '1w', '1m', '3m'
  const [tempDateRange, setTempDateRange] = useState('1m');
  const [sortOrder, setSortOrder] = useState('DESC'); // 'DESC', 'ASC'
  const [tempSortOrder, setTempSortOrder] = useState('DESC');
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  // 푸시 알림으로 받은 공지만 보기 필터 모드
  const [isPushFilterMode, setIsPushFilterMode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsPushFilterMode(false);
    }
  }, [isAuthenticated]);

  const togglePushFilter = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '푸시 알림 기록은 로그인 후 이용할 수 있어요.');
      return;
    }
    setIsPushFilterMode(prev => !prev);
  }, [isAuthenticated]);

  // 1. 앱 시작 시 저장된 필터 데이터 불러오기
  useEffect(() => {
    const initFilters = async () => {
      try {
        const filterKey = STORAGE_KEYS.FILTER_SETTINGS || 'filter_settings';
        const saved = await getData(filterKey);

        if (saved && Array.isArray(saved) && saved.length > 0) {
          setSelectedSources(saved as string[]);
        } else {
          setSelectedSources([]);
        }
      } catch (e) {
        console.error('필터 로딩 에러:', e);
        setSelectedSources([]);
      }
    };
    initFilters();
  }, []);

  // 1-1. 외부(홈 화면 등)에서 넘어온 검색어 처리
  useEffect(() => {
    if (route.params?.initialQuery) {
      const initial = route.params.initialQuery;
      setInputText(initial);
      setQuery(initial);
      navigation.setParams({ initialQuery: undefined });
    }
  }, [route.params?.initialQuery, navigation]);

  // 1-2. 푸시 알림 클릭으로 진입 시 푸시 필터 모드 자동 활성화 + ID 저장
  useEffect(() => {
    if (route.params?.openPushFilter && isAuthenticated) {
      const ids: string[] = route.params?.pushedIds ?? [];
      ids.forEach(id => addPushedNotice?.(id));
      setIsPushFilterMode(true);
      navigation.setParams({ openPushFilter: undefined, pushedIds: undefined });
    }
  }, [route.params?.openPushFilter, route.params?.pushedIds, isAuthenticated, addPushedNotice, navigation]);

  const debouncedSetQuery = useRef(
    debounce((text: string) => {
      setQuery(text);
    }, 500),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  const persistFilters = async (newList: string[]) => {
    try {
      const filterKey = STORAGE_KEYS.FILTER_SETTINGS || 'filter_settings';
      await saveData(filterKey, newList);
    } catch (e) {
      console.error('필터 저장 에러:', e);
    }
  };

  const {
    data: allNotices = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notices', query, dateRange, sortOrder],
    queryFn: fetchNotices,
  });

  const handleClearCache = async () => {
    if (__DEV__) console.log('Refresh button pressed. Refetching...');
    try {
      await refetch();
      if (__DEV__) console.log('Refetch command sent.');
    } catch (error) {
      console.error('Refetch failed:', error);
    }
  };

  const handleCloseModal = useCallback(() => {
    setModalSearchQuery('');
    setFilterModalVisible(false);
  }, []);

  const openFilterModal = useCallback(() => {
    setTempSelectedSources([...selectedSources]);
    setFilterModalVisible(true);
  }, [selectedSources]);

  const toggleTempSource = (code: string) => {
    setTempSelectedSources(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  };

  const toggleTempAll = () => {
    const allCodes = Object.keys(SOURCE_LABELS);
    setTempSelectedSources(prev => (prev.length === allCodes.length ? [] : allCodes));
  };

  const handleApplyFilters = async () => {
    setSelectedSources(tempSelectedSources);
    await persistFilters(tempSelectedSources);
    handleCloseModal();
  };

  const openDateModal = useCallback(() => {
    setTempDateRange(dateRange);
    setTempSortOrder(sortOrder);
    setDateModalVisible(true);
  }, [dateRange, sortOrder]);

  const handleApplyDateFilters = useCallback(() => {
    setDateRange(tempDateRange);
    setSortOrder(tempSortOrder);
    setDateModalVisible(false);
  }, [tempDateRange, tempSortOrder]);

  const toggleSource = (code: string) => {
    const updated = selectedSources.includes(code)
      ? selectedSources.filter(c => c !== code)
      : [...selectedSources, code];
    setSelectedSources(updated);
    persistFilters(updated);
  };

  const toggleAll = () => {
    const allCodes = Object.keys(SOURCE_LABELS);
    const updated = selectedSources.length !== allCodes.length ? allCodes : [];
    setSelectedSources(updated);
    persistFilters(updated);
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const normalizeSource = useCallback((source: string) => {
    if (!source) return null;
    const key = source
      .split(/[\/|_]/)[0]
      .toUpperCase()
      .trim();

    if ((SOURCE_LABELS as any)[key]) return key;

    const foundCode = Object.keys(SOURCE_LABELS).find(code =>
      source.startsWith((SOURCE_LABELS as any)[code]),
    );

    return foundCode || null;
  }, []);

  const unreadCount = useMemo(() => {
    return allNotices.filter((item: any) => {
      const sourcePrefix = normalizeSource(item.source);
      const matchesSourceFilter =
        selectedSources.length > 0 && selectedSources.includes(sourcePrefix || '');
      return matchesSourceFilter && !safeStatus[item.id];
    }).length;
  }, [allNotices, selectedSources, safeStatus, normalizeSource]);

  const handleMarkAllAsRead = useCallback(() => {
    if (!markMultipleAsRead) return;
    const unreadIds = allNotices
      .filter((item: any) => {
        const sourcePrefix = normalizeSource(item.source);
        const matchesSourceFilter =
          selectedSources.length > 0 && selectedSources.includes(sourcePrefix || '');
        return matchesSourceFilter && !safeStatus[item.id];
      })
      .map((item: any) => item.id);

    if (unreadIds.length > 0) {
      markMultipleAsRead(unreadIds, true);
    }
  }, [allNotices, selectedSources, safeStatus, normalizeSource, markMultipleAsRead]);

  const displayedData = useMemo(() => {
    if (isPushFilterMode) {
      return allNotices.filter((item: any) => {
        const itemId = String(item.notice_id || item.id);
        const matchesReadFilter = filterMode === 'all' || !safeStatus[item.id];
        return pushedNoticeIds.includes(itemId) && matchesReadFilter;
      });
    }
    return allNotices.filter((item: any) => {
      const sourcePrefix = normalizeSource(item.source);
      const matchesSourceFilter =
        selectedSources.length > 0 && selectedSources.includes(sourcePrefix || '');
      const matchesReadFilter = filterMode === 'all' || !safeStatus[item.id];
      return matchesSourceFilter && matchesReadFilter;
    });
  }, [
    allNotices,
    selectedSources,
    safeStatus,
    filterMode,
    normalizeSource,
    isPushFilterMode,
    pushedNoticeIds,
  ]);

  const handleNoticePress = useCallback(
    (item: any) => {
      navigation.navigate('Detail', { item });
    },
    [navigation],
  );

  return {
    query,
    inputText,
    setInputText,
    filterMode,
    setFilterMode,
    isFilterModalVisible,
    setFilterModalVisible,
    modalSearchQuery,
    setModalSearchQuery,
    selectedSources,
    isCommonExpanded,
    setIsCommonExpanded,
    isDeptExpanded,
    setIsDeptExpanded,
    dateRange,
    setDateRange,
    sortOrder,
    setSortOrder,
    isDateModalVisible,
    setDateModalVisible,
    debouncedSetQuery,
    isLoading,
    isRefetching,
    handleClearCache,
    handleCloseModal,
    openFilterModal,
    toggleTempSource,
    toggleTempAll,
    handleApplyFilters,
    toggleSource,
    toggleAll,
    onRefresh,
    unreadCount,
    displayedData,
    handleNoticePress,
    handleMarkAllAsRead,
    safeStatus,
    tempSelectedSources,
    tempDateRange,
    setTempDateRange,
    tempSortOrder,
    setTempSortOrder,
    openDateModal,
    handleApplyDateFilters,
    isPushFilterMode,
    togglePushFilter,
    pushedNoticeIds,
    clearPushedNotices,
  };
}
