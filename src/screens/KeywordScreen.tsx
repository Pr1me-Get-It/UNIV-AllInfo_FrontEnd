import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { syncKeywords, deleteUserKeyword } from '../api/userService';
import LoginPlaceholder from '../components/ui/LoginPlaceholder'
// 데이터 그룹 분리
const DEPARTMENTS = [
  { label: "컴퓨터", value: "CSE" },
  { label: "전자", value: "SEE" },
  { label: "전기", value: "ELE" },
];

const POPULAR_KEYWORDS = [
  { label: "장학", value: "장학" },
  { label: "공모전", value: "공모전" },
  { label: "인턴", value: "인턴" },
  { label: "채용", value: "채용" },
  { label: "특강", value: "특강" },
  { label: "휴강", value: "휴강" },
  { label: "봉사", value: "봉사" },
  { label: "교환학생", value: "교환학생" },
];

export default function KeywordScreen({ navigation }) {
  const [keywords, setKeywords] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userEmail, isAuthenticated } = useAuth();

  const fetchKeywords = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const response = await syncKeywords(userEmail);
      // [중요] response.data.keywords가 없을 경우를 대비해 빈 배열([])로 기본값 설정
      if (response.data && response.data.success) {
        setKeywords(response.data.keywords || []);
      }
    } catch (error) {
      // 500 에러 발생 시 여기서 잡힙니다.
      console.error("키워드 로딩 실패", error.response?.data || error.message);
      setKeywords([]); // 에러 발생 시 상태를 초기화하여 다음 로직 오류 방지
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
    }, [isAuthenticated, userEmail, fetchKeywords])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userEmail) {
      fetchKeywords().finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [userEmail, fetchKeywords]);

  const addKeyword = async (input) => {
    const keywordToAdd = typeof input === 'object' ? input.value : input;

    if (!keywordToAdd || !keywordToAdd.trim()) return;

    const trimmedKeyword = keywordToAdd.trim();

    if (Array.isArray(keywords) && keywords.includes(trimmedKeyword)) {
      Alert.alert("알림", "이미 등록된 키워드입니다.");
      return;
    }

    // 1. [낙관적 업데이트] UI 먼저 갱신
    const prevKeywords = [...keywords]; // 롤백용 이전 상태 저장
    const newKeywords = [trimmedKeyword, ...prevKeywords];

    setKeywords(newKeywords);
    setInputText('');

    setLoading(true);
    try {
      // 2. 백그라운드에서 API 호출
      console.log(`➕ [추가 시도] ${trimmedKeyword} 추가 중... (전송될 리스트: ${newKeywords})`);
      const response = await syncKeywords(userEmail, newKeywords);

      if (response.data && response.data.success) {
        console.log(`✅ [추가 완료] 백엔드에 반영됨.`);
        // 성공 시: 서버 데이터로 최신화 (혹시 모를 동기화)
        // 만약 서버 데이터가 비어있다면, 우리가 로컬에서 만든 newKeywords 유지
        const serverKeywords = response.data.keywords;
        if (serverKeywords && serverKeywords.length > 0) {
          setKeywords(serverKeywords);
        }
      } else {
        throw new Error("Server indicated failure");
      }
    } catch (error) {
      console.error(`❌ [추가 에러]`, error);
      // 3. 실패 시: 롤백 (원상복구)
      setKeywords(prevKeywords);
      Alert.alert("오류", "서버 문제로 키워드를 추가할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const deleteKeyword = async (keywordToDelete) => {
    if (!userEmail) return;

    // [수정] 낙관적 업데이트: UI에서 하나만 제거
    const prevKeywords = [...keywords];
    const newKeywords = keywords.filter(k => k !== keywordToDelete);

    console.log(`🗑 [삭제 시도] ${keywordToDelete} 삭제 중... (현재: ${prevKeywords} -> 예정: ${newKeywords})`);

    setKeywords(newKeywords);

    try {
      const response = await deleteUserKeyword(userEmail, keywordToDelete);

      if (response.data.success) {
        console.log(`✅ [삭제 완료] 백엔드에서 ${keywordToDelete} 삭제됨.`);
        // 서버에서 최신 리스트를 주면 그것으로 한 번 더 동기화 (선택 사항)
        if (response.data.keywords) {
          setKeywords(response.data.keywords);
        }
      } else {
        console.error(`❌ [삭제 실패] 백엔드 응답 실패:`, response.data);
        // 실패 시 롤백
        setKeywords(prevKeywords);
        Alert.alert("오류", "키워드 삭제 실패");
      }
    } catch (e) {
      console.error(`❌ [삭제 에러] 네트워크/서버 오류:`, e);
      // 에러 발생 시 롤백
      setKeywords(prevKeywords);
      Alert.alert("오류", "네트워크 오류로 삭제 실패");
    }
  };


  if (!isAuthenticated) {
    return <LoginPlaceholder />;
  }

  const renderItem = ({ item }) => (
    <View style={styles.registeredKeywordItem}>
      <Text style={styles.registeredKeywordText}>#{item}</Text>
      <TouchableOpacity onPress={() => deleteKeyword(item)}>
        <Ionicons name="close-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderRecommendations = () => (
    <View style={styles.recommendContainer}>

      <Text style={styles.recommendLabel}>학부</Text>
      <View style={styles.chipWrapper}>
        {DEPARTMENTS.map((k, i) => (
          <TouchableOpacity key={i} style={[styles.chip, styles.deptChip]} onPress={() => addKeyword(k)}>
            <Text style={[styles.chipText, { fontWeight: 'bold', color: '#333' }]}>+ {k.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.recommendLabel, { marginTop: 24 }]}>인기 키워드</Text>
      <View style={styles.chipWrapper}>
        {POPULAR_KEYWORDS.map((k, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => addKeyword(k)}>
            <Text style={styles.chipText}>+ {k.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );


  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>키워드 알림</Text>
          <Text style={styles.description}>관심있는 키워드(학부 코드 포함)를 등록하면 알림을 보내드려요.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="rgb(219, 31, 38)" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={keywords}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>등록된 키워드가 없습니다.</Text>
              </View>
            }
            ListFooterComponent={renderRecommendations}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="rgb(219, 31, 38)" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f5f5', paddingBottom: 90 },
  keyboardView: { flex: 1 },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },

  listContent: { padding: 20, flexGrow: 1 },

  registeredKeywordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgb(219, 31, 38)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  registeredKeywordText: { fontSize: 16, color: '#fff', fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#999' },

  recommendContainer: { marginTop: 10, marginBottom: 40 },
  recommendLabel: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 12, marginLeft: 4 },

  chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  deptChip: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  chipText: { color: '#374151', fontSize: 14, fontWeight: '500' },

  inputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, fontSize: 16, marginRight: 10 },
  addButton: { backgroundColor: 'rgb(219, 31, 38)', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },

  // 비로그인 화면 스타일 (다른 탭과 통일)
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  msg: { fontSize: 16, color: '#888', marginBottom: 15 },
  btn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
});