import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl // 👈 1. 새로고침 컴포넌트 추가
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { getToken } from '../utils/storage';

const RECOMMENDED_KEYWORDS = ["장학", "공모전", "인턴", "채용", "특강", "휴강", "졸업", "봉사", "교환학생"];
const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_EMAIL = "test@knu.ac.kr";

export default function KeywordScreen() {
  const [keywords, setKeywords] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // 👈 2. 새로고침 상태 추가
  const [email, setEmail] = useState(null);

  useEffect(() => {
    getUserEmailAndFetchKeywords();
  }, []);

  // 3. 이메일 확보 및 키워드 조회 (핵심 함수)
  const getUserEmailAndFetchKeywords = async () => {
    if (!refreshing) setLoading(true); // 새로고침 중이 아닐 때만 로딩 표시
    
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("로그인 필요", "로그인이 필요한 기능입니다.");
        setLoading(false);
        return;
      }

      let userEmail = null;

      // 개발자 모드 확인
      if (token === DEV_TOKEN) {
        console.log("⚡ [Keyword] 개발자 모드");
        userEmail = DEV_EMAIL;
      } else {
        // 구글 로그인 확인
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          userEmail = userInfo.email;
        }
      }

      if (userEmail) {
        setEmail(userEmail);
        await fetchKeywords(userEmail);
      }

    } catch (e) {
      console.error("데이터 로딩 실패:", e);
    } finally {
      setLoading(false);
      setRefreshing(false); // 👈 새로고침 종료
    }
  };

  // 4. 키워드 조회 함수 (GET 대신 POST 사용 꼼수 적용 - 웹 호환성 및 404 방지)
  const fetchKeywords = async (userEmail) => {
    try {
      // 💡 조회할 때도 POST를 쓰면 Body 데이터가 확실히 전달됩니다. (빈 배열 전송)
      const response = await api.post('/user/keyword', {
        email: userEmail,
        keywords: [] 
      });
      
      if (response.data.success) {
        setKeywords(response.data.keywords || []);
      }
    } catch (e) {
      // 만약 유저가 없다면(404), 자동 등록을 시도하는 복구 로직
      if (e.message.includes('404')) {
        console.log("⚠️ 유저 미등록 감지 -> 자동 등록 시도");
        await api.post('/user/register', { email: userEmail, expoPushToken: null });
        // 등록 후 재조회
        const retry = await api.post('/user/keyword', { email: userEmail, keywords: [] });
        if (retry.data.success) setKeywords(retry.data.keywords);
      } else {
        console.error("키워드 조회 에러:", e);
      }
    }
  };

  // 5. 새로고침 핸들러
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getUserEmailAndFetchKeywords(); // 데이터 다시 불러오기
  }, []);

  const addKeyword = async (keywordToAdd) => {
    const targetKeyword = typeof keywordToAdd === 'string' ? keywordToAdd : inputText.trim();
    if (!targetKeyword) return;
    if (!email) {
      Alert.alert("오류", "사용자 정보가 없습니다. 새로고침 해주세요.");
      return;
    }
    if (keywords.includes(targetKeyword)) {
      Alert.alert("알림", "이미 등록된 키워드입니다.");
      return;
    }

    try {
      const response = await api.post('/user/keyword', {
        email: email,
        keywords: [targetKeyword]
      });
      if (response.data.success) {
        setKeywords(response.data.keywords);
        setInputText('');
      }
    } catch (e) {
      Alert.alert("오류", "키워드 추가 실패");
    }
  };

  const deleteKeyword = async (keywordToDelete) => {
    if (!email) return;
    try {
      const response = await api.delete('/user/keyword', {
        data: { email: email, keywords: [keywordToDelete] }
      });
      if (response.data.success) {
        setKeywords(response.data.keywords);
      }
    } catch (e) {
      Alert.alert("오류", "키워드 삭제 실패");
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
      <Text style={styles.recommendLabel}>이런 키워드는 어때요?</Text>
      <View style={styles.chipWrapper}>
        {RECOMMENDED_KEYWORDS.map((k, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => addKeyword(k)}>
            <Text style={styles.chipText}>+ {k}</Text>
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
          <Text style={styles.description}>관심있는 키워드를 등록하면 푸시 알림을 보내드려요.</Text>
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
            // 👇 6. FlatList에 RefreshControl 연결
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
  mainContainer: { flex: 1, backgroundColor: '#fff', paddingBottom: 90 },
  keyboardView: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },
  listContent: { padding: 20, flexGrow: 1 },
  registeredKeywordItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgb(219, 31, 38)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  registeredKeywordText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#999' },
  recommendContainer: { marginTop: 20, marginBottom: 40 },
  recommendLabel: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 15, textAlign: 'center' },
  chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  chipText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, fontSize: 16, marginRight: 10 },
  addButton: { backgroundColor: 'rgb(219, 31, 38)', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 }
});