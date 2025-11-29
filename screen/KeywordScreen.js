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
import { AlramContext } from '../data/Alram'; // Context 사용

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
  
  // Context에서 현재 로그인된 이메일 가져오기
  const { userEmail } = useContext(AlramContext);

  // 이메일이 변경되거나 화면이 포커스될 때 데이터 로드
  useFocusEffect(
    useCallback(() => {
      if (userEmail) {
        fetchKeywords(userEmail);
      } else {
        setKeywords([]);
        setLoading(false);
      }
    }, [userEmail])
  );

  const fetchKeywords = async (email) => {
    try {
      // GET 대신 POST 사용 (Body 전송 문제 해결용 꼼수)
      const response = await api.post('/user/keyword', {
        email: email,
        keywords: [] 
      });
      if (response.data.success) {
        setKeywords(response.data.keywords || []);
      }
    } catch (e) {
      // 유저가 없는 경우(404) 자동 등록 시도 후 재조회
      if (e.message && e.message.includes('404')) {
        try {
          await api.post('/user/register', { email: email, expoPushToken: null });
          const retry = await api.post('/user/keyword', { email: email, keywords: [] });
          if (retry.data.success) setKeywords(retry.data.keywords);
        } catch (err) {
          console.error("유저 자동 등록 실패:", err);
        }
      } else {
        console.error("키워드 로딩 실패:", e);
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userEmail) {
      fetchKeywords(userEmail).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [userEmail]);

  const addKeyword = async (keywordToAdd) => {
    const targetKeyword = typeof keywordToAdd === 'object' ? keywordToAdd.value : (keywordToAdd || inputText).trim();

    if (!targetKeyword) return;
    
    if (!userEmail) {
      Alert.alert("오류", "로그인이 필요한 기능입니다.");
      return;
    }

    if (keywords.includes(targetKeyword)) {
      Alert.alert("알림", `이미 등록된 키워드입니다: ${targetKeyword}`);
      return;
    }

    try {
      const response = await api.post('/user/keyword', {
        email: userEmail,
        keywords: [targetKeyword]
      });
      if (response.data.success) {
        setKeywords(response.data.keywords);
        setInputText('');
      }
    } catch (e) {
      Alert.alert("오류", "키워드 추가 실패");
      console.error(e);
    }
  };

  const deleteKeyword = async (keywordToDelete) => {
    if (!userEmail) return;
    try {
      const response = await api.delete('/user/keyword', {
        data: { email: userEmail, keywords: [keywordToDelete] }
      });
      if (response.data.success) {
        setKeywords(response.data.keywords);
      }
    } catch (e) {
      Alert.alert("오류", "키워드 삭제 실패");
      console.error(e);
    }
  };

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

  // 비로그인 상태일 때 화면
  if (!userEmail) {
    return (
      <View style={styles.loginContainer}>
        <Ionicons name="key-outline" size={60} color="#ccc" style={{ marginBottom: 20 }} />
        <Text style={styles.msg}>로그인이 필요한 기능입니다.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('All')}>
          <Text style={styles.btnText}>로그인 하러 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

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