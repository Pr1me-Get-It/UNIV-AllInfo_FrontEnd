/* screen/NoticeScreen.tsx */

import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { AlarmContext } from '../data/Alarm';
import SOURCE_LABELS from '../constants/labeltag.json';
import { saveData, getData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { COLORS } from '../constants/colors';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { syncKeywords } from '../api/userService';
import NoticeItem from '../components/NoticeItem';
import { fetchNotices } from '../api/noticeService';
import { COMMON_TAGS } from '../constants/noticeCategories';
import { moderateScale } from '../utils/responsive';
import debounce from 'lodash.debounce';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NoticeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTab'>;

interface Props {
  navigation: NoticeScreenNavigationProp;
  route: any;
}

export default function NoticeScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const { readStatus } = useContext(AlarmContext) || { readStatus: {} };
  const { userEmail } = useAuth(); // 유저 이메일 가져오기
  const safeStatus = readStatus || {};

  const [query, setQuery] = useState('');
  const [inputText, setInputText] = useState(''); // 타이핑용 로컬 상태
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
      // 로컬 인풋과 실제 쿼리 상태 모두 업데이트
      setInputText(initial);
      setQuery(initial);
      
      // 파라미터 사용 후 속성 제거 (뒤로가기 등 재진입 시 중복 방지)
      (navigation as any).setParams({ initialQuery: undefined });
    }
  }, [route.params?.initialQuery]);

  // 검색 인풋 디바운스 적용
  const debouncedSetQuery = useRef(
    debounce((text: string) => {
      setQuery(text);
    }, 500) // 500ms 지연
  ).current;

  // 컴포넌트 언마운트 시 메모리 누수 방지
  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  // 필터 저장 함수
  const persistFilters = async (newList: string[]) => {
    try {
      const filterKey = STORAGE_KEYS.FILTER_SETTINGS || 'filter_settings';
      await saveData(filterKey, newList);
    } catch (e) {
      console.error('필터 저장 에러:', e);
    }
  };

  // --- 3. React Query: useQuery 사용 (한 달치 데이터 모두 로드) ---
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

  const handleCloseModal = () => {
    setModalSearchQuery('');
    setFilterModalVisible(false);
  };

  const toggleSource = async (code: string) => {
    const isAdding = !selectedSources.includes(code);
    const updated = isAdding ? [...selectedSources, code] : selectedSources.filter(c => c !== code);

    setSelectedSources(updated);
    persistFilters(updated);

    // [키워드 연동] 필터 선택 시 키워드 자동 추가/삭제
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

        // 로컬 저장 및 서버 동기화
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

    // [키워드 연동] 전체 선택/해제 시 키워드 일괄 처리
    if (userEmail) {
      try {
        const safeEmail = userEmail.replace(/\./g, '_');
        const localKeywords = (await getData<string[]>(STORAGE_KEYS.KEYWORDS(safeEmail))) || [];
        let newKeywords = [...localKeywords];

        if (isSelectingAll) {
          // 전체 추가: 없는 것들만 추가
          allCodes.forEach(code => {
            if (!newKeywords.includes(code)) newKeywords.push(code);
          });
        } else {
          // 전체 해제: 학과 코드들만 제거 (사용자 정의 키워드는 유지)
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

    // 1. 코드로 찾기 (예: "CSE")
    if ((SOURCE_LABELS as any)[key]) return key;

    // 2. 이름으로 찾기 (예: "음악학과학사공지" -> "음악학과" -> "MUS")
    const foundCode = Object.keys(SOURCE_LABELS).find(
      code => source.startsWith((SOURCE_LABELS as any)[code]),
    );

    return foundCode || null;
  }, []);

  // --- 5. 클라이언트 사이드 필터링 & 카운트 ---
  // 주의: 서버 페이지네이션을 사용하므로, unreadCount는 '현재 로드된 데이터' 기준입니다.
  const unreadCount = useMemo(() => {
    return allNotices.filter((item: any) => {
      const sourcePrefix = normalizeSource(item.source);
      return (!sourcePrefix || selectedSources.includes(sourcePrefix)) && !safeStatus[item.id];
    }).length;
  }, [allNotices, selectedSources, safeStatus]);

  const displayedData = useMemo(() => {
    return allNotices.filter((item: any) => {
      const sourcePrefix = normalizeSource(item.source);
      const matchesSourceFilter = !sourcePrefix || selectedSources.includes(sourcePrefix);

      const matchesReadFilter = filterMode === 'all' || !safeStatus[item.id];
      return matchesSourceFilter && matchesReadFilter;
    });
  }, [allNotices, selectedSources, safeStatus, filterMode]);

  const handleNoticePress = useCallback((item: any) => {
    navigation.navigate('Detail', { item });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Ionicons name="albums" size={28} color="#333" />
          <AppText style={styles.headerText}>공지사항</AppText>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.filterIconButton, { marginRight: 5 }]}
            onPress={handleClearCache}>
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterIconButton, { marginRight: 5 }]}
            onPress={() => setDateModalVisible(true)}>
            <Ionicons name="time-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="filter-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Range Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDateModalVisible}
        onRequestClose={() => setDateModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDateModalVisible(false)}
        >
          <View style={[styles.bottomSheet, { height: 'auto', paddingBottom: 40 }]}>
            <View style={styles.sheetHeader}>
              <AppText style={styles.sheetTitle}>기간 설정</AppText>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.filterItem, dateRange === '1w' && styles.filterItemActive]}
              onPress={() => { setDateRange('1w'); setDateModalVisible(false); }}
            >
              <View style={styles.filterItemContent}>
                <AppText style={[styles.filterItemText, dateRange === '1w' && styles.filterItemTextActive]}>1주일</AppText>
                {dateRange === '1w' && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterItem, dateRange === '1m' && styles.filterItemActive]}
              onPress={() => { setDateRange('1m'); setDateModalVisible(false); }}
            >
              <View style={styles.filterItemContent}>
                <AppText style={[styles.filterItemText, dateRange === '1m' && styles.filterItemTextActive]}>1개월</AppText>
                {dateRange === '1m' && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterItem, dateRange === '3m' && styles.filterItemActive]}
              onPress={() => { setDateRange('3m'); setDateModalVisible(false); }}
            >
              <View style={styles.filterItemContent}>
                <AppText style={[styles.filterItemText, dateRange === '3m' && styles.filterItemTextActive]}>3개월</AppText>
                {dateRange === '3m' && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </View>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 }} />

            <AppText style={[styles.sheetTitle, { marginBottom: 15 }]}>정렬 기준</AppText>

            <TouchableOpacity
              style={[styles.filterItem, sortOrder === 'DESC' && styles.filterItemActive]}
              onPress={() => { setSortOrder('DESC'); setDateModalVisible(false); }}
            >
              <View style={styles.filterItemContent}>
                <AppText style={[styles.filterItemText, sortOrder === 'DESC' && styles.filterItemTextActive]}>최신순</AppText>
                {sortOrder === 'DESC' && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterItem, sortOrder === 'ASC' && styles.filterItemActive]}
              onPress={() => { setSortOrder('ASC'); setDateModalVisible(false); }}
            >
              <View style={styles.filterItemContent}>
                <AppText style={[styles.filterItemText, sortOrder === 'ASC' && styles.filterItemTextActive]}>오래된순</AppText>
                {sortOrder === 'ASC' && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <AppText style={styles.sheetTitle}>공지 목록</AppText>
              <View style={styles.modalSearchBox}>
                <Ionicons name="search" size={16} color="#888" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="학과명 검색..."
                  value={modalSearchQuery}
                  onChangeText={(text) => {
                    setModalSearchQuery(text);
                    if (text) {
                      setIsCommonExpanded(true);
                      setIsDeptExpanded(true);
                    }
                  }}
                  placeholderTextColor="#aaa"
                />
                {modalSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleCloseModal}>
                <AppText style={styles.saveButtonText}>저장</AppText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterList} contentContainerStyle={{ paddingBottom: 40 }}>
              {!modalSearchQuery && (
                <TouchableOpacity
                  style={[
                    styles.filterItem,
                    selectedSources.length === Object.keys(SOURCE_LABELS).length &&
                    styles.filterItemActive,
                  ]}
                  onPress={toggleAll}>
                  <View style={styles.filterItemContent}>
                    <AppText style={styles.filterItemText}>전체 선택</AppText>
                    <Ionicons
                      name={
                        selectedSources.length === Object.keys(SOURCE_LABELS).length
                          ? 'checkbox'
                          : 'square-outline'
                      }
                      size={22}
                      color={
                        selectedSources.length === Object.keys(SOURCE_LABELS).length
                          ? COLORS.primary
                          : '#ccc'
                      }
                    />
                  </View>
                </TouchableOpacity>
              )}

              {/* 공통 섹션 */}
              <View>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setIsCommonExpanded(!isCommonExpanded)}>
                  <AppText style={styles.sectionHeaderText}>공통</AppText>
                  <Ionicons
                    name={isCommonExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#555"
                  />
                </TouchableOpacity>
                {isCommonExpanded &&
                  Object.entries(SOURCE_LABELS)
                    .filter(([code]) => COMMON_TAGS.includes(code))
                    .filter(([code, name]) => (name as string).includes(modalSearchQuery))
                    .map(([code, name]) => {
                      const isChecked = selectedSources.includes(code);
                      return (
                        <TouchableOpacity
                          key={code}
                          style={[styles.filterItem, isChecked && styles.filterItemActive]}
                          onPress={() => toggleSource(code)}>
                          <View style={styles.filterItemContent}>
                            <AppText
                              style={[
                                styles.filterItemText,
                                isChecked && styles.filterItemTextActive,
                              ]}>
                              {name as string}
                            </AppText>
                            <Ionicons
                              name={isChecked ? 'checkbox' : 'square-outline'}
                              size={22}
                              color={isChecked ? COLORS.primary : '#ccc'}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
              </View>

              {/* 학과 섹션 */}
              <View>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setIsDeptExpanded(!isDeptExpanded)}>
                  <AppText style={styles.sectionHeaderText}>학과</AppText>
                  <Ionicons
                    name={isDeptExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#555"
                  />
                </TouchableOpacity>
                {isDeptExpanded &&
                  Object.entries(SOURCE_LABELS)
                    .filter(([code]) => !COMMON_TAGS.includes(code))
                    .filter(([code, name]) => (name as string).includes(modalSearchQuery))
                    .map(([code, name]) => {
                      const isChecked = selectedSources.includes(code);
                      return (
                        <TouchableOpacity
                          key={code}
                          style={[styles.filterItem, isChecked && styles.filterItemActive]}
                          onPress={() => toggleSource(code)}>
                          <View style={styles.filterItemContent}>
                            <AppText
                              style={[
                                styles.filterItemText,
                                isChecked && styles.filterItemTextActive,
                              ]}>
                              {name as string}
                            </AppText>
                            <Ionicons
                              name={isChecked ? 'checkbox' : 'square-outline'}
                              size={22}
                              color={isChecked ? COLORS.primary : '#ccc'}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.balanceContainer}>
        <AppText style={styles.balanceLabel}>확인하지 않은 공지사항</AppText>
        <AppText style={styles.balanceText}>{unreadCount} 개</AppText>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="공지사항 검색..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            debouncedSetQuery(text);
          }}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {inputText.length > 0 && (
          <TouchableOpacity onPress={() => { setInputText(''); setQuery(''); }}>
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, filterMode === 'all' && styles.tabButtonActive]}
          onPress={() => setFilterMode('all')}>
          <AppText style={[styles.tabText, filterMode === 'all' && styles.tabTextActive]}>
            전체
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, filterMode === 'unread' && styles.tabButtonActive]}
          onPress={() => setFilterMode('unread')}>
          <AppText style={[styles.tabText, filterMode === 'unread' && styles.tabTextActive]}>
            미확인
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={displayedData}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
          onRefresh={onRefresh}
          refreshing={isRefetching}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          ListFooterComponent={isLoading ? <ActivityIndicator style={{ margin: 10 }} /> : null}
          ListEmptyComponent={
            !isLoading ? (
              <AppText style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
                우상단 필터 버튼을 눌러 공지를 선택해주세요!.
              </AppText>
            ) : null
          }
          renderItem={({ item }) => (
            <NoticeItem
              item={item}
              isRead={safeStatus[item.id] === true}
              onPress={handleNoticePress}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: '#333' },
  filterIconButton: { padding: 5 },
  balanceContainer: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginBottom: moderateScale(10, 0.3),
    padding: moderateScale(10, 0.3),
    borderRadius: moderateScale(12, 0.3),
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(12, 0.3),
    marginBottom: moderateScale(2, 0.3),
    includeFontPadding: false,
  },
  balanceText: {
    color: 'white',
    fontSize: moderateScale(24, 0.3),
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: moderateScale(8, 0.3),
    paddingHorizontal: moderateScale(15, 0.3),
    paddingVertical: moderateScale(2, 0.3),
    borderRadius: moderateScale(10, 0.3),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: { flex: 1, fontSize: moderateScale(14, 0.3), color: '#333', includeFontPadding: false },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 110,
    paddingVertical: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: moderateScale(8, 0.3),
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: moderateScale(3, 0.3),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(4, 0.3),
    borderRadius: 999,
  },
  tabButtonActive: { backgroundColor: 'rgba(219, 31, 38, 0.08)' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  modalSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 40,
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: '#333', marginLeft: 5 },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  filterList: { flex: 1 },
  filterItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
    paddingHorizontal: 5,
  },
  filterItemActive: { backgroundColor: 'rgba(219, 31, 38, 0.05)' },
  filterItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterItemText: { fontSize: 16, color: '#333' },
  filterItemTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    backgroundColor: '#f8f8f8',
    marginTop: 10,
    borderRadius: 8,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
});
