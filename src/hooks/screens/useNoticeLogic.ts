import { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { AlarmContext } from '../../data/Alarm';
import SOURCE_LABELS from '../../constants/labeltag.json';
import { saveData, getData } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { useAuth } from '../../context/AuthContext';
import { syncKeywords } from '../../api/userService';
import { fetchNotices } from '../../api/noticeService';

export function useNoticeLogic(navigation: any, route: any) {
  const queryClient = useQueryClient();
  const alarmContext = useContext(AlarmContext);
  const readStatus = alarmContext ? alarmContext.readStatus : {};
  const markMultipleAsRead = alarmContext?.markMultipleAsRead;
  const { userEmail } = useAuth();
  const safeStatus = readStatus || {};

  const [query, setQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isCommonExpanded, setIsCommonExpanded] = useState(false);
  const [isDeptExpanded, setIsDeptExpanded] = useState(false);

  // Date Range, Sort State
  const [dateRange, setDateRange] = useState('1m'); // '1w', '1m', '3m'
  const [sortOrder, setSortOrder] = useState('DESC'); // 'DESC', 'ASC'
  const [isDateModalVisible, setDateModalVisible] = useState(false);

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

  const debouncedSetQuery = useRef(
    debounce((text: string) => {
      setQuery(text);
    }, 500)
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

  const toggleSource = async (code: string) => {
    const isAdding = !selectedSources.includes(code);
    const updated = isAdding ? [...selectedSources, code] : selectedSources.filter(c => c !== code);

    setSelectedSources(updated);
    persistFilters(updated);

    if (userEmail) {
      try {
        const safeEmail = userEmail.replace(/\./g, '_');
        const localKeywords = (await getData<string[]>(STORAGE_KEYS.KEYWORDS(safeEmail))) || [];
        let newKeywords = [...localKeywords];

        if (isAdding) {
          if (!newKeywords.includes(code)) newKeywords.push(code);
        } else {
          newKeywords = newKeywords.filter(k => k !== code);
        }

        await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), newKeywords);
        await syncKeywords(userEmail, newKeywords);
        if (__DEV__) console.log(`🔗 [필터-키워드 연동] ${code} ${isAdding ? '추가' : '삭제'}됨.`);
      } catch (e) {
        console.error('키워드 연동 실패:', e);
      }
    }
  };

  const toggleAll = async () => {
    const allCodes = Object.keys(SOURCE_LABELS);
    const isSelectingAll = selectedSources.length !== allCodes.length;
    const updated = isSelectingAll ? allCodes : [];

    setSelectedSources(updated);
    persistFilters(updated);

    if (userEmail) {
      try {
        const safeEmail = userEmail.replace(/\./g, '_');
        const localKeywords = (await getData<string[]>(STORAGE_KEYS.KEYWORDS(safeEmail))) || [];
        let newKeywords = [...localKeywords];

        if (isSelectingAll) {
          allCodes.forEach(code => {
            if (!newKeywords.includes(code)) newKeywords.push(code);
          });
        } else {
          newKeywords = newKeywords.filter(k => !allCodes.includes(k));
        }

        await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), newKeywords);
        await syncKeywords(userEmail, newKeywords);
        if (__DEV__) console.log(`🔗 [필터-키워드 연동] 전체 ${isSelectingAll ? '추가' : '해제'} 완료.`);
      } catch (e) {
        console.error('키워드 전체 연동 실패:', e);
      }
    }
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const normalizeSource = useCallback((source: string) => {
    if (!source) return null;
    const key = source.split(/[\/|]/)[0].toUpperCase().trim();

    if ((SOURCE_LABELS as any)[key]) return key;

    const foundCode = Object.keys(SOURCE_LABELS).find(
      code => source.startsWith((SOURCE_LABELS as any)[code]),
    );

    return foundCode || null;
  }, []);

  const unreadCount = useMemo(() => {
    return allNotices.filter((item: any) => {
      const sourcePrefix = normalizeSource(item.source);
      const matchesSourceFilter = selectedSources.length > 0 && selectedSources.includes(sourcePrefix || '');
      return matchesSourceFilter && !safeStatus[item.id];
    }).length;
  }, [allNotices, selectedSources, safeStatus, normalizeSource]);

  const handleMarkAllAsRead = useCallback(() => {
    if (!markMultipleAsRead) return;
    const unreadIds = allNotices
      .filter((item: any) => {
        const sourcePrefix = normalizeSource(item.source);
        const matchesSourceFilter = selectedSources.length > 0 && selectedSources.includes(sourcePrefix || '');
        return matchesSourceFilter && !safeStatus[item.id];
      })
      .map((item: any) => item.id);
      
    if (unreadIds.length > 0) {
      markMultipleAsRead(unreadIds, true);
    }
  }, [allNotices, selectedSources, safeStatus, normalizeSource, markMultipleAsRead]);

  const displayedData = useMemo(() => {
    return allNotices.filter((item: any) => {
      const sourcePrefix = normalizeSource(item.source);
      const matchesSourceFilter = selectedSources.length > 0 && selectedSources.includes(sourcePrefix || '');
      const matchesReadFilter = filterMode === 'all' || !safeStatus[item.id];
      return matchesSourceFilter && matchesReadFilter;
    });
  }, [allNotices, selectedSources, safeStatus, filterMode, normalizeSource]);

  const handleNoticePress = useCallback((item: any) => {
    navigation.navigate('Detail', { item });
  }, [navigation]);

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
    toggleSource,
    toggleAll,
    onRefresh,
    unreadCount,
    displayedData,
    handleNoticePress,
    handleMarkAllAsRead,
    safeStatus,
  };
}
