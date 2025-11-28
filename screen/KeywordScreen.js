import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { getToken } from '../utils/storage';

// 추천 키워드 목록
const RECOMMENDED_KEYWORDS = ["장학", "공모전", "인턴", "채용", "특강", "휴강", "졸업", "봉사", "교환학생"];
const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_EMAIL = "test@knu.ac.kr";

export default function KeywordScreen() {
  const [keywords, setKeywords] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    getUserEmailAndFetchKeywords();
  }, []);

  const getUserEmailAndFetchKeywords = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("로그인 필요", "키워드 알림을 받으려면 로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      if (token === DEV_TOKEN) {
        console.log("⚡ [Keyword] 개발자 모드 감지");
        setEmail(DEV_EMAIL);
        await fetchKeywords(DEV_EMAIL);
        setLoading(false);
        return;
      }

      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        if (userInfo.email) {
          setEmail(userInfo.email);
          await fetchKeywords(userInfo.email);
        }
      }
    } catch (e) {
      console.error("초기 데이터 로딩 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywords = async (userEmail) => {
    try {
      const response = await api.get('/user/keyword', {
        data: { email: userEmail } 
      });
      if (response.data.success) {
        setKeywords(response.data.keywords || []);
      }
    } catch (e) {
      console.error("키워드 조회 실패:", e);
    }
  };

  const addKeyword = async (keywordToAdd) => {
    const targetKeyword = typeof keywordToAdd === 'string' ? keywordToAdd : inputText.trim();

    if (!targetKeyword) return;
    
    if (!email) {
      Alert.alert("오류", "사용자 정보를 불러오지 못했습니다.");
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
      Alert.alert("오류", "키워드 추가 중 문제가 발생했습니다.");
      console.error(e);
    }
  };

  const deleteKeyword = async (keywordToDelete) => {
    if (!email) return;
    try {
      const response = await api.delete('/user/keyword', {
        data: { 
          email: email, 
          keywords: [keywordToDelete] 
        }
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

  // 👇 [수정] 추천 키워드 영역을 별도 함수로 분리 (항상 보여주기 위해)
  const renderRecommendations = () => (
    <View style={styles.recommendContainer}>
      <Text style={styles.recommendLabel}>이런 키워드는 어때요?</Text>
      <View style={styles.chipWrapper}>
        {RECOMMENDED_KEYWORDS.map((k, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.chip} 
            onPress={() => addKeyword(k)}
          >
            <Text style={styles.chipText}>+ {k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>키워드 알림</Text>
          <Text style={styles.description}>
            관심있는 키워드를 등록하면 푸시 알림을 보내드려요.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="rgb(219, 31, 38)" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={keywords}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            
            // 👇 비어있을 땐 문구만 표시
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>등록된 키워드가 없습니다.</Text>
              </View>
            }
            
            // 👇 [핵심] 항상 하단에 추천 키워드 표시
            ListFooterComponent={renderRecommendations}
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 90, 
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: { 
    fontSize: 14, 
    color: '#666', 
    lineHeight: 20 
  },
  listContent: { 
    padding: 20,
    flexGrow: 1, 
  },
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
    elevation: 3,
  },
  registeredKeywordText: { 
    fontSize: 16, 
    color: '#fff', 
    fontWeight: '700' 
  },
  
  // Empty & Recommend Styles
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 30,
    marginBottom: 20 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#999' 
  },
  recommendContainer: {
    marginTop: 20,
    marginBottom: 40, // 하단 여백
  },
  recommendLabel: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#888', 
    marginBottom: 15,
    textAlign: 'center'
  },
  chipWrapper: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    justifyContent: 'center' 
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  }
});