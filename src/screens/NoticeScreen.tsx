import React from 'react';
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
import SOURCE_LABELS from '../constants/labeltag.json';
import { COLORS } from '../constants/colors';
import NoticeItem from '../components/NoticeItem';
import { COMMON_TAGS } from '../constants/noticeCategories';
import { moderateScale } from '../utils/responsive';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useNoticeLogic } from '../hooks/screens/useNoticeLogic';

type NoticeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTab'>;

interface Props {
  navigation: NoticeScreenNavigationProp;
  route: any;
}

export default function NoticeScreen({ navigation, route }: Props) {
  const {
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
  } = useNoticeLogic(navigation, route);

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
        <View style={styles.balanceLeft}>
          <AppText style={styles.balanceLabel}>확인하지 않은 공지사항</AppText>
          <AppText style={styles.balanceText}>{unreadCount} 개</AppText>
        </View>
        <TouchableOpacity style={styles.markAllReadButton} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done" size={moderateScale(18, 0.3)} color="white" />
          <AppText style={styles.markAllReadText}>모두 읽음</AppText>
        </TouchableOpacity>
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
          <TouchableOpacity onPress={() => { setInputText(''); debouncedSetQuery(''); }}>
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
                {selectedSources.length === 0
                  ? '우상단 필터 버튼을 눌러 공지를 선택해주세요!'
                  : '지정된 기간(1개월 등) 내에 해당 조건의 공지사항이 없습니다.'}
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
    paddingHorizontal: moderateScale(16, 0.3),
    borderRadius: moderateScale(12, 0.3),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {
    justifyContent: 'center',
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
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: moderateScale(10, 0.3),
    paddingVertical: moderateScale(8, 0.3),
    borderRadius: moderateScale(8, 0.3),
  },
  markAllReadText: {
    color: 'white',
    fontSize: moderateScale(12, 0.3),
    fontWeight: '600',
    marginLeft: moderateScale(4, 0.3),
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
    marginBottom: 10,
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
