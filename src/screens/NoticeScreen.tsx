/* screen/NoticeScreen.tsx */

import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
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

export default function NoticeScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const { readStatus } = useContext(AlarmContext) || { readStatus: {} };
  const { userEmail } = useAuth(); // 유저 이메일 가져오기
  const safeStatus = readStatus || {};

  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // 1. 앱 시작 시 저장된 필터 데이터 불러오기
  useEffect(() => {
    const initFilters = async () => {
      try {
        const filterKey = STORAGE_KEYS.FILTER_SETTINGS || 'filter_settings';
        const saved = await getData(filterKey);

        if (saved && Array.isArray(saved) && saved.length > 0) {
          setSelectedSources(saved as string[]);
        } else {
          setSelectedSources(Object.keys(SOURCE_LABELS));
        }
      } catch (e) {
        console.error('필터 로딩 에러:', e);
        setSelectedSources(Object.keys(SOURCE_LABELS));
      }
    };
    initFilters();
  }, []);

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
    queryKey: ['notices', query],
    queryFn: fetchNotices,
  });

  const handleClearCache = async () => {
    console.log('Refresh button pressed. Refetching...');
    try {
      await refetch();
      console.log('Refetch command sent.');
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
        console.log(`🔗 [필터-키워드 연동] ${code} ${isAdding ? '추가' : '삭제'}됨.`);
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
        console.log(`🔗 [필터-키워드 연동] 전체 ${isSelectingAll ? '추가' : '해제'} 완료.`);
      } catch (e) {
        console.error('키워드 전체 연동 실패:', e);
      }
    }
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const normalizeSource = (source: string) => {
    if (!source) return null;
    const key = source.split(/[\/|]/)[0].toUpperCase().trim();

    // 1. 코드로 찾기 (예: "CSE")
    if ((SOURCE_LABELS as any)[key]) return key;

    // 2. 이름으로 찾기 (예: "음악학과학사공지" -> "음악학과" -> "MUS")
    // "공지사항" 텍스트 제거에 의존하지 않고, 학과명으로 시작하는지 확인
    const foundCode = Object.keys(SOURCE_LABELS).find(
      code => source.startsWith((SOURCE_LABELS as any)[code]),
    );

    return foundCode || null;
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Ionicons name="albums" size={28} color="#333" />
          <Text style={styles.headerText}>공지사항</Text>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.filterIconButton, { marginRight: 10 }]}
            onPress={handleClearCache}>
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="filter-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>학과 필터</Text>
              <View style={styles.modalSearchBox}>
                <Ionicons name="search" size={16} color="#888" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="학과명 검색..."
                  value={modalSearchQuery}
                  onChangeText={setModalSearchQuery}
                  placeholderTextColor="#aaa"
                />
                {modalSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleCloseModal}>
                <Text style={styles.saveButtonText}>저장</Text>
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
                    <Text style={styles.filterItemText}>전체 선택</Text>
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

              {Object.entries(SOURCE_LABELS)
                .filter(([code, name]) => (name as string).includes(modalSearchQuery))
                .map(([code, name]) => {
                  const isChecked = selectedSources.includes(code);
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.filterItem, isChecked && styles.filterItemActive]}
                      onPress={() => toggleSource(code)}>
                      <View style={styles.filterItemContent}>
                        <Text
                          style={[styles.filterItemText, isChecked && styles.filterItemTextActive]}>
                          {name as string}
                        </Text>
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={isChecked ? COLORS.primary : '#ccc'}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>확인하지 않은 공지사항</Text>
        <Text style={styles.balanceText}>{unreadCount} 개</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="공지사항 검색..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, filterMode === 'all' && styles.tabButtonActive]}
          onPress={() => setFilterMode('all')}>
          <Text style={[styles.tabText, filterMode === 'all' && styles.tabTextActive]}>
            전체
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, filterMode === 'unread' && styles.tabButtonActive]}
          onPress={() => setFilterMode('unread')}>
          <Text style={[styles.tabText, filterMode === 'unread' && styles.tabTextActive]}>
            미확인
          </Text>
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
          ListFooterComponent={isLoading ? <ActivityIndicator style={{ margin: 10 }} /> : null}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
                데이터가 없습니다.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <NoticeItem
              item={item}
              isRead={safeStatus[item.id] === true}
              onPress={() => navigation.navigate('Detail', { item })}
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
    marginBottom: 15,
    padding: 10,
    borderRadius: 15,
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
  balanceText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
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
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
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
});
