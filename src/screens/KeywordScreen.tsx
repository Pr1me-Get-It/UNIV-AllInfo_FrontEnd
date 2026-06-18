import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Linking,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import LoginPlaceholder from '../components/ui/LoginPlaceholder';
import CustomAlert from '../components/ui/CustomAlert';
import SOURCE_LABELS from '../constants/labeltag.json';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useKeywordLogic, POPULAR_KEYWORDS } from '../hooks/screens/useKeywordLogic';

type KeywordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Keyword'>;

interface Props {
  navigation: KeywordScreenNavigationProp;
}

export default function KeywordScreen({ navigation }: Props) {
  const {
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
  } = useKeywordLogic();

  const [activeTab, setActiveTab] = React.useState<'keyword' | 'academic'>('keyword');

  if (!isAuthenticated) {
    return <LoginPlaceholder />;
  }

  const renderKeywordItem = ({ item }: { item: string }) => (
    <View style={styles.manualKeywordItem}>
      <AppText style={styles.manualKeywordText}>#{item}</AppText>
      <TouchableOpacity onPress={() => deleteKeyword(item)}>
        <Ionicons name="close-circle" size={20} color="#555" />
      </TouchableOpacity>
    </View>
  );

  const renderAcademicItem = ({ item }: { item: string }) => (
    <View style={styles.registeredKeywordItem}>
      <AppText style={styles.registeredKeywordText}>#{SOURCE_LABELS[item] ?? item}</AppText>
      <TouchableOpacity onPress={() => deleteAcademicSource(item)}>
        <Ionicons name="close-circle" size={20} color="rgb(219, 31, 38)" />
      </TouchableOpacity>
    </View>
  );

  const renderRecommendations = () => (
    <View style={styles.recommendContainer}>
      <AppText style={[styles.recommendLabel, { marginTop: 0 }]}>인기 키워드</AppText>
      <View style={styles.chipWrapper}>
        {POPULAR_KEYWORDS.map((k, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => addKeyword(k.value)}>
            <AppText style={styles.chipText}>+ {k.label}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAcademicRecommendations = () => (
    <View style={styles.recommendContainer}>
      <AppText style={[styles.recommendLabel, { marginTop: 0 }]}>학과/기관 추천</AppText>
      <View style={styles.chipWrapper}>
        {availableDepts.map((dept, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.chip, styles.deptChip]}
            onPress={() => addAcademicSource(dept.code)}>
            <AppText style={styles.chipText}>+ {dept.label}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>키워드 알림</AppText>
          <AppText style={styles.description}>
            관심있는 키워드를 등록하면 알림을 보내드려요.
          </AppText>
        </View>

        {pushStatus !== 'enabled' && (
          <View style={styles.pushBanner}>
            <Ionicons name="notifications-off-outline" size={16} color="#92400E" />
            <AppText style={styles.pushBannerText}>
              {pushStatus === 'system_disabled'
                ? '기기 알림이 꺼져 있어 알림을 받을 수 없어요.'
                : '앱 알림이 꺼져 있어요.'}
            </AppText>
            <TouchableOpacity
              style={styles.pushBannerButton}
              activeOpacity={0.8}
              onPress={() => {
                if (pushStatus === 'system_disabled') {
                  Linking.openSettings();
                } else {
                  navigation.navigate('Profile' as any);
                }
              }}>
              <AppText style={styles.pushBannerButtonText}>
                {pushStatus === 'system_disabled' ? '설정 열기' : '알림 켜기'}
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'keyword' && styles.activeTabButton]}
            onPress={() => setActiveTab('keyword')}
            activeOpacity={0.8}>
            <AppText style={[styles.tabText, activeTab === 'keyword' && styles.activeTabText]}>
              키워드 알림
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'academic' && styles.activeTabButton]}
            onPress={() => setActiveTab('academic')}
            activeOpacity={0.8}>
            <AppText style={[styles.tabText, activeTab === 'academic' && styles.activeTabText]}>
              학사 알림
            </AppText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="rgb(219, 31, 38)" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={activeTab === 'keyword' ? keywords : academicSources}
            keyExtractor={(item, index) => index.toString()}
            renderItem={activeTab === 'keyword' ? renderKeywordItem : renderAcademicItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <AppText style={styles.emptyText}>
                  {activeTab === 'keyword'
                    ? '등록된 키워드가 없습니다.'
                    : '수신 동의한 학사/학과 알림이 없습니다.'}
                </AppText>
              </View>
            }
            ListFooterComponent={
              activeTab === 'keyword' ? renderRecommendations : renderAcademicRecommendations
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="rgb(219, 31, 38)"
              />
            }
          />
        )}

        {activeTab === 'keyword' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="직접 입력 (예: 장학금)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => addKeyword(inputText)}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => addKeyword(inputText)}>
              <Ionicons name="arrow-up" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* 커스텀 알림창 컴포넌트 */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={closeAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#ffffff', paddingBottom: 90 },
  keyboardView: { flex: 1 },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },

  pushBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pushBannerText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
  pushBannerButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  pushBannerButtonText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  listContent: { padding: 20, flexGrow: 1 },

  registeredKeywordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgb(219, 31, 38)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  registeredKeywordText: { fontSize: 16, color: 'rgb(219, 31, 38)', fontWeight: '700' },

  // [추가] 직접 등록한 키워드 스타일 (다크 그레이 톤)
  manualKeywordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#555', // 진한 회색 테두리
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  manualKeywordText: { fontSize: 16, color: '#333', fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#999' },

  recommendContainer: { marginTop: 10, marginBottom: 40 },
  recommendLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    marginLeft: 4,
  },

  chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deptChip: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  chipText: { color: '#374151', fontSize: 14, fontWeight: '500' },

  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: 'rgb(219, 31, 38)',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // 비로그인 화면 스타일 (다른 탭과 통일)
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  msg: { fontSize: 16, color: '#888', marginBottom: 15 },
  btn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },

  // 토글 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'rgb(219, 31, 38)',
    fontWeight: 'bold',
  },
});
