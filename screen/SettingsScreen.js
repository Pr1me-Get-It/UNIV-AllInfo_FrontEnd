// screen/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator,Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { saveToken, getToken, removeToken } from '../utils/storage';

// 웹 브라우저 인증 세션 처리를 위해 필요
WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. 구글 로그인 설정 (Scopes 추가 필수)
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "94128920654-8evjj075bdbue1oblstrohqkvab3cma6.apps.googleusercontent.com",
    iosClientId: "94128920654-8evjj075bdbue1oblstrohqkvab3cma6.apps.googleusercontent.com",
    webClientId: "94128920654-8evjj075bdbue1oblstrohqkvab3cma6.apps.googleusercontent.com",
    scopes: ['email', 'profile'], // [중요] 이 부분이 있어야 유저 정보를 가져올 수 있습니다.
  });

  // 2. 앱 실행 시 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 3. 구글 로그인 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log("구글 로그인 성공, 토큰:", authentication.accessToken);
      handleLoginSuccess(authentication.accessToken);
    } else if (response?.type === 'error') {
      console.error("구글 로그인 에러:", response.error);
      setLoading(false);
    }
  }, [response]);

  // 저장된 토큰 확인
  const checkLoginStatus = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        await fetchUserInfo(token);
      } else {
        setUserInfo(null);
      }
    } catch (e) {
      console.log("로그인 체크 실패", e);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // [핵심] 구글 유저 정보 가져오기
  const fetchUserInfo = async (token) => {
    try {
      // 더 안정적인 API 엔드포인트로 변경
      const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        console.log("유저 정보 가져오기 성공:", user);
        setUserInfo(user);      // 여기서 상태가 바뀌면 화면이 갱신됩니다.
        await saveToken(token); // 토큰 저장
      } else {
        console.log("유저 정보 가져오기 실패 (Status):", res.status);
        setUserInfo(null);
        await removeToken();
      }
    } catch (error) {
      console.log("유저 정보 조회 중 에러 발생:", error);
      setUserInfo(null);
    }
  };

  // 로그인 성공 핸들러
  const handleLoginSuccess = async (token) => {
    setLoading(true); // 로딩 시작 (새로고침 효과)
    await fetchUserInfo(token);
    setLoading(false); // 로딩 종료 (화면 갱신)
  };

  // 로그아웃 핸들러
  const executeLogout = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        // 구글 토큰 만료 요청
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        console.log("구글 토큰 만료 성공");
      }
    } catch (e) {
      console.error("토큰 만료 요청 중 에러 (무시하고 진행):", e);
    } finally {
      // 기기 데이터 삭제 및 상태 초기화
      await removeToken();
      setUserInfo(null);
      setLoading(false);
    }
  };

  // 로그아웃 버튼 핸들러
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // [웹 환경] 브라우저 기본 confirm 창 사용
      if (window.confirm("로그아웃 하시겠습니까?")) {
        executeLogout();
      }
    } else {
      // [앱 환경] React Native Alert 사용
      Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: executeLogout, // 위에서 만든 함수 실행
        }
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={{ marginTop: 10, color: '#666' }}>잠시만 기다려주세요...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* --- 프로필 섹션 --- */}
      <View style={styles.profileSection}>
        {userInfo ? (
          // 로그인 상태
          <View style={styles.userInfoContainer}>
            <Image 
              source={{ uri: userInfo.picture }} 
              style={styles.profileImage} 
            />
            <View>
              <Text style={styles.userName}>{userInfo.name}</Text>
              <Text style={styles.userEmail}>{userInfo.email}</Text>
            </View>
          </View>
        ) : (
          // 로그아웃 상태
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>로그인이 필요합니다.</Text>
            <TouchableOpacity 
              style={styles.googleButton} 
              disabled={!request}
              onPress={() => promptAsync()}
            >
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>Google로 로그인</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* --- 계정 설정 (로그인 시에만 보임) --- */}
      {userInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 설정</Text>
          <TouchableOpacity style={styles.item}>
              <Text style={styles.itemText}>프로필 수정</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handleLogout}>
              <Text style={[styles.itemText, { color: 'rgb(219, 31, 38)' }]}>로그아웃</Text>
              <Ionicons name="log-out-outline" size={20} color="rgb(219, 31, 38)" />
          </TouchableOpacity>
        </View>
      )}

      {/* --- 앱 설정 --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 설정</Text>
        <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>알림 설정</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>버전 정보</Text>
            <Text style={styles.versionText}>0.1.0</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  profileSection: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 100,
    justifyContent: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    marginLeft: 10,
    marginTop: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  versionText: {
    fontSize: 14,
    color: '#888',
  },
});