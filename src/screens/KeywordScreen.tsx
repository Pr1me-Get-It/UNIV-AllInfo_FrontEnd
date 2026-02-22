import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import AppText from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { syncKeywords, deleteUserKeyword, getUserKeywords } from '../api/userService';
import LoginPlaceholder from '../components/ui/LoginPlaceholder';
import CustomAlert from '../components/ui/CustomAlert';
import { getData, saveData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
// 데이터 그룹 분리
import SOURCE_LABELS from '../constants/labeltag.json';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type KeywordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Keyword'>;

interface Props {
  navigation: KeywordScreenNavigationProp;
}

// 데이터 그룹 분리
// [변경] 학부 직접 추가 UI 제거됨

const POPULAR_KEYWORDS = [
  { label: '장학', value: '장학' },
  { label: '공모전', value: '공모전' },
  { label: '인턴', value: '인턴' },
  { label: '채용', value: '채용' },
  { label: '특강', value: '특강' },
  { label: '휴강', value: '휴강' },
  { label: '봉사', value: '봉사' },
  { label: '교환학생', value: '교환학생' },
];

export default function KeywordScreen({ navigation }: Props) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userEmail, isAuthenticated } = useAuth();

  // 커스텀 알림창 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title, message) => {
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

    // 이메일에서 특수문자 제거하여 키 생성
    const safeEmail = userEmail.replace(/\./g, '_');

    try {
      // 1. [로컬 스토리지] 로드하여 표시
      // 백엔드 GET(조회) API가 500 에러를 반환하고, POST(동기화)는 데이터를 덮어쓰는 구조이므로
      // 화면 진입 시에는 서버와 동기화하지 않고 오직 로컬 데이터만 보여줍니다.
      // 실제 데이터 업데이트(추가/삭제)는 해당 동작 수행 시 API를 호출하여 처리합니다.
      const localKeywords = await getData(STORAGE_KEYS.KEYWORDS(safeEmail));

      if (localKeywords && Array.isArray(localKeywords)) {
        setKeywords(localKeywords);
        if (__DEV__) console.log(` [로컬 로드] 저장된 키워드 불러오기 성공:`, localKeywords);
      } else {
        // 로컬 데이터가 없으면 빈 배열
        setKeywords([]);
      }
    } catch (error) {
      console.error('키워드 로컬 로딩 실패', error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // 이메일이 변경되거나 화면이 포커스될 때 데이터 로드
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

  const addKeyword = async input => {
    const keywordToAdd = typeof input === 'object' ? input.value : input;

    if (!keywordToAdd || !keywordToAdd.trim()) return;

    const trimmedKeyword = keywordToAdd.trim();

    if (Array.isArray(keywords) && keywords.includes(trimmedKeyword)) {
      showAlert('알림', '이미 등록된 키워드입니다.');
      return;
    }

    // 1. [낙관적 업데이트] UI 먼저 갱신
    const prevKeywords = [...keywords]; // 롤백용 이전 상태 저장
    // [변경] 순서 변경: 기존 리스트 뒤에 추가 (아래로 쌓이게)
    const newKeywords = [...prevKeywords, trimmedKeyword];

    setKeywords(newKeywords);
    setInputText('');

    // [추가] 로컬 스토리지 즉시 저장
    if (userEmail) {
      const safeEmail = userEmail.replace(/\./g, '_');
      if (__DEV__) console.log(`💾 [로컬 저장] 키워드 추가 후 로컬 스토리지 업데이트: ${trimmedKeyword}`);
    }

    try {
      if (__DEV__) console.log(`➕ [추가 시도] ${trimmedKeyword} 추가 중... (전송될 리스트: ${newKeywords})`);
      const response = await syncKeywords(userEmail, newKeywords);

      if (response.data && response.data.success) {
        if (__DEV__) console.log(`✅ [추가 완료] 백엔드에 반영됨.`);
        // 성공 시: 서버 데이터로 최신화 (혹시 모를 동기화)
        // 만약 서버 데이터가 비어있다면, 우리가 로컬에서 만든 newKeywords 유지
        const serverKeywords = response.data.keywords;
        if (serverKeywords && serverKeywords.length > 0) {
          setKeywords(serverKeywords);
          // 서버 데이터로 로컬 스토리지 최신화
          const safeEmail = userEmail.replace(/\./g, '_');
          await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), serverKeywords);
        }
      } else {
        throw new Error('Server indicated failure');
      }
    } catch (error) {
      console.error(`❌ [추가 에러]`, error);
      // 3. 실패 시: 롤백 (원상복구)
      setKeywords(prevKeywords);
      if (userEmail) {
        const safeEmail = userEmail.replace(/\./g, '_');
        await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), prevKeywords);
      }
      showAlert('오류', '서버 문제로 키워드를 추가할 수 없습니다.');
    } finally {
      // setLoading(false);
    }
  };

  const deleteKeyword = async keywordToDelete => {
    if (!userEmail) return;

    // [수정] 낙관적 업데이트: UI에서 하나만 제거
    // [보호 로직] 학과 코드(필터 연동)인 경우 삭제 방지
    if (SOURCE_LABELS[keywordToDelete]) {
      showAlert('알림', '학과 키워드는 [공지사항 필터]에서 해제해주세요.');
      return;
    }

    const prevKeywords = [...keywords];
    const newKeywords = keywords.filter(k => k !== keywordToDelete);

    if (__DEV__) {
      console.log(
        `🗑 [삭제 시도] ${keywordToDelete} 삭제 중... (현재: ${prevKeywords} -> 예정: ${newKeywords})`,
      );
    }

    setKeywords(newKeywords);

    // [추가] 로컬 스토리지 즉시 저장
    const safeEmail = userEmail.replace(/\./g, '_');
    await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), newKeywords);
    if (__DEV__) console.log(`💾 [로컬 저장] 키워드 삭제 후 로컬 스토리지 업데이트: ${keywordToDelete}`);

    try {
      const response = await deleteUserKeyword(userEmail, keywordToDelete);

      if (response.data.success) {
        if (__DEV__) console.log(`✅ [삭제 완료] 백엔드에서 ${keywordToDelete} 삭제됨.`);
        // 서버에서 최신 리스트를 주면 그것으로 한 번 더 동기화
        if (response.data.keywords) {
          setKeywords(response.data.keywords);
          // 서버 데이터로 로컬 스토리지 최신화
          await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), response.data.keywords);
        }
      } else {
        console.error(`❌ [삭제 실패] 백엔드 응답 실패:`, response.data);
        // 실패 시 롤백
        setKeywords(prevKeywords);
        await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), prevKeywords);
        showAlert('오류', '키워드 삭제 실패');
      }
    } catch (e) {
      console.error(`❌ [삭제 에러] 네트워크/서버 오류:`, e);
      // 에러 발생 시 롤백
      setKeywords(prevKeywords);
      await saveData(STORAGE_KEYS.KEYWORDS(safeEmail), prevKeywords); // 로컬 스토리지 롤백
      showAlert('오류', '네트워크 오류로 삭제 실패');
    }
  };

  if (!isAuthenticated) {
    return <LoginPlaceholder />;
  }

  // [정렬 로직] 1. 학과 키워드(필터 순서) -> 2. 일반 키워드(추가된 순서)
  const sortedKeywords = useMemo(() => {
    const deptKeys = Object.keys(SOURCE_LABELS);

    // 학과 키워드와 일반 키워드 분리
    const deptKeywords = keywords.filter(k => SOURCE_LABELS[k]);
    const manualKeywords = keywords.filter(k => !SOURCE_LABELS[k]);

    // 학과 키워드 정렬 (labeltag.json 순서)
    deptKeywords.sort((a, b) => {
      return deptKeys.indexOf(a) - deptKeys.indexOf(b);
    });

    return [...deptKeywords, ...manualKeywords];
  }, [keywords]);

  const renderItem = ({ item }) => {
    // [변경] 코드가 있으면 한글 명칭(예: 컴퓨터학부)으로 표시, 없으면 그대로 표시
    const isDept = !!SOURCE_LABELS[item];
    const displayName = isDept ? SOURCE_LABELS[item] : item;

    // 학과 키워드(빨간색) vs 직접 등록 키워드(회색/검정) 스타일 분리
    const itemStyle = isDept ? styles.registeredKeywordItem : styles.manualKeywordItem;
    const textStyle = isDept ? styles.registeredKeywordText : styles.manualKeywordText;
    const iconColor = isDept ? 'rgb(219, 31, 38)' : '#555';

    return (
      <View style={itemStyle}>
        <AppText style={textStyle}>#{displayName}</AppText>
        {!isDept && (
          <TouchableOpacity onPress={() => deleteKeyword(item)}>
            <Ionicons name="close-circle" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRecommendations = () => (
    <View style={styles.recommendContainer}>
      <AppText style={[styles.recommendLabel, { marginTop: 0 }]}>인기 키워드</AppText>
      <View style={styles.chipWrapper}>
        {POPULAR_KEYWORDS.map((k, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => addKeyword(k)}>
            <AppText style={styles.chipText}>+ {k.label}</AppText>
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
          <AppText style={styles.description}>관심있는 키워드를 등록하면 알림을 보내드려요.</AppText>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="rgb(219, 31, 38)" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={sortedKeywords}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <AppText style={styles.emptyText}>등록된 키워드가 없습니다.</AppText>
              </View>
            }
            ListFooterComponent={renderRecommendations}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="rgb(219, 31, 38)"
              />
            }
          />
        )}

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
});
