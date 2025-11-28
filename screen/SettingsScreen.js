import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Switch,
  ScrollView,
  Modal,
  TextInput // 👈 TextInput, Modal 추가
} from 'react-native';
// ... 기존 import 유지 ...
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { saveToken, getToken, removeToken } from '../utils/storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { makeRedirectUri } from 'expo-auth-session';
import { api } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

const PRIMARY = 'rgb(219, 31, 38)';
const DEV_USER = {
  email: "test@knu.ac.kr",
  name: "개발자",
  picture: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
};
const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_PASSWORD = "1557"; // 👈 비밀번호 설정

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 비밀번호 입력 모달 관련 State
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

 
  const appVersion = Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || "1.0.0";

  // ...  google login setup ...
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: Platform.OS === 'web' ? window.location.origin : makeRedirectUri({
      scheme: 'univ-allinfo'
    }),
    scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar.events'],
  });

  // ... 기존 useEffect 및 checkLoginStatus, fetchUserInfo ...
  useEffect(() => {
    checkLoginStatus();
  }, []);

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

  const fetchUserInfo = async (token) => {
    if (token === DEV_TOKEN) {
      console.log("⚡ 개발자 모드로 로그인되었습니다.");
      setUserInfo(DEV_USER);
      return;
    }
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setUserInfo(user);
        await saveToken(token);
      } else {
        setUserInfo(null);
        await removeToken();
      }
    } catch (error) {
      console.log("유저 정보 조회 중 에러 발생:", error);
      setUserInfo(null);
    }
  };

  // 👇 [수정] 실제 로그인을 수행하는 함수 (비밀번호 확인 후 호출됨)
  const performDevLogin = async () => {
    setLoading(true);
    try {
      await saveToken(DEV_TOKEN);
      setUserInfo(DEV_USER);

      console.log(`📡 개발자 계정 등록 시도: ${DEV_USER.email}`);
      await api.post('/user/register', { 
        email: DEV_USER.email, 
        expoPushToken: null 
      });
      
      Alert.alert("성공", "개발자 계정(test@knu.ac.kr)으로 로그인 및 등록되었습니다.");
    } catch (e) {
      console.error("개발자 로그인 실패:", e);
      Alert.alert("에러", "개발자 등록 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 👇 [추가] 비밀번호 확인 로직
  const handlePasswordSubmit = () => {
    if (passwordInput === DEV_PASSWORD) {
      setIsPasswordModalVisible(false);
      setPasswordInput(''); // 입력 초기화
      performDevLogin();    // 로그인 진행
    } else {
      Alert.alert("오류", "비밀번호가 틀렸습니다.");
    }
  };

  const handleLoginSuccess = async (token) => {
    setLoading(true);
    await fetchUserInfo(token);
    setLoading(false);
  };

  const executeLogout = async () => { /* ... 기존 로직 유지 ... */ 
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      }
    } catch (e) {
      console.error("토큰 만료 요청 중 에러 (무시하고 진행):", e);
    } finally {
      await removeToken();
      setUserInfo(null);
      setLoading(false);
    }
  };

  const handleLogout = () => { /* ... 기존 로직 유지 ... */
     if (Platform.OS === 'web') {
      if (window.confirm("로그아웃 하시겠습니까?")) {
        executeLogout();
      }
    } else {
      Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "확인", onPress: executeLogout }
      ]);
    }
  };

  const handleFeedback = () => { /* ... 기존 로직 유지 ... */
    Alert.alert(
      '피드백',
      '불편한 점이나 개선 아이디어가 있다면\n팀 Notion 또는 GitHub 이슈에 남겨주세요!'
    );
  };

  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightPushOnly, setNightPushOnly] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const handlePushToggle = async (value) => { /* ... 기존 로직 유지 ... */
    setPushEnabled(value); 
    if (value) {
      let tokenData = null;
      try {
        tokenData = await registerForPushNotificationsAsync();
      } catch (err) {
        console.log("푸시 토큰 요청 중 에러:", err);
        setPushEnabled(false);
        return;
      }
      const token = typeof tokenData === "string" ? tokenData : tokenData?.data;
      if (!token) {
        console.log("푸시 토큰 없음 → 알림 OFF");
        setPushEnabled(false);
        return;
      }
      console.log("발급된 Expo 토큰:", token);
      try {
        const emailToSend = userInfo ? userInfo.email : "pastoboy@knu.com";
        const response = await api.post('/user/register', {
          email: emailToSend,
          expoPushToken: token
        });
        console.log("서버 응답:", response.data);
        Alert.alert("설정 완료", "푸시 알림이 설정되었습니다.");
      } catch (e) {
        console.error("서버 등록 실패:", e);
        setPushEnabled(false);
        Alert.alert("오류", "서버 등록 중 문제가 발생했습니다.");
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ marginTop: 10, color: '#666' }}>잠시만 기다려주세요...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 160 }}>
      
      {/* 👇 [추가] 비밀번호 입력 모달 */}
      <Modal
        visible={isPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>개발자 모드 인증</Text>
            <Text style={styles.modalDesc}>비밀번호를 입력하세요.</Text>
            
            <TextInput 
              style={styles.passwordInput}
              secureTextEntry
              placeholder="비밀번호"
              keyboardType="number-pad"
              value={passwordInput}
              onChangeText={setPasswordInput}
              maxLength={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  setPasswordInput('');
                }}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalConfirmBtn]} 
                onPress={handlePasswordSubmit}
              >
                <Text style={styles.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.section}>
        {userInfo ? (
          <View style={styles.loginCardLoggedIn}>
             {/* ... 기존 로그인된 화면 UI 유지 ... */}
            <View style={styles.profileInfo}>
              <Image
                source={{ uri: userInfo.picture }}
                style={styles.profileImage}
              />
              <View>
                <Text style={styles.welcomeText}>로그인됨</Text>
                <Text style={styles.userNameText}>{userInfo.name} 님</Text>
                <Text style={styles.emailText}>{userInfo.email}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginCard}>
            <Text style={styles.sectionTitle}>로그인</Text>
            <Text style={styles.sectionDescription}>
              학교 공지를 개인화해서 받고 캘린더를 연동하려면 Google 계정으로 로그인하세요.
            </Text>

            <TouchableOpacity
              style={styles.googleLoginButton}
              disabled={!request}
              onPress={() => promptAsync()}
            >
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleLoginButtonText}>Google로 로그인</Text>
            </TouchableOpacity>
            
            {/* 👇 [수정] 버튼 누르면 모달 열기 */}
            <TouchableOpacity 
              style={[styles.googleLoginButton, { backgroundColor: '#333', marginTop: 10 }]} 
              onPress={() => setIsPasswordModalVisible(true)}
            >
              <Ionicons name="code-slash" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleLoginButtonText}>개발자 로그인 (Test)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ... 나머지 섹션들 (알림 설정, 앱 정보 등) 기존 코드 유지 ... */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림 설정</Text>
        <SettingRow
          label="푸시 알림 받기"
          description="중요 공지, 마감 알림 등을 푸시로 받아요."
          value={pushEnabled}
          onValueChange={handlePushToggle}
        />
        <SettingRow
          label="알림 소리"
          description="알림이 도착했을 때 소리를 재생합니다."
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
        <SettingRow
          label="야간에는 중요한 공지만"
          description="밤 11시 ~ 아침 7시에는 마감 임박/긴급 공지만 보내요."
          value={nightPushOnly}
          onValueChange={setNightPushOnly}
        />
      </View>
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>공지 · 홍보</Text>
        <SettingRow
          label="행사/대외활동 홍보 허용"
          description="학교/동아리 행사, 대외활동 홍보 알림을 받습니다."
          value={marketingEnabled}
          onValueChange={setMarketingEnabled}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('안내', 'Google 계정 관리는 Google 설정에서 가능합니다.')}
        >
          <View>
            <Text style={styles.menuLabel}>계정 정보 수정</Text>
            <Text style={styles.menuDescription}>Google 계정 설정을 확인합니다.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        {userInfo && (
          <TouchableOpacity style={styles.menuRowDanger} onPress={handleLogout}>
            <Text style={styles.menuLabelDanger}>로그아웃</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.menuRowStatic}>
          <Text style={styles.menuLabel}>버전</Text>
          <Text style={styles.menuDescription}>v{appVersion}</Text>
        </View>
        <TouchableOpacity style={styles.menuRow} onPress={handleFeedback}>
          <View>
            <Text style={styles.menuLabel}>피드백 보내기</Text>
            <Text style={styles.menuDescription}>
              버그 제보, 기능 요청, UI 의견 등을 개발 팀에게 전달합니다.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, description, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {!!description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E5E7EB", true: PRIMARY }}
        thumbColor={"#fff"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ... 기존 스타일 ...
  page: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sectionDescription: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  loginCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  loginCardLoggedIn: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#eee' },
  welcomeText: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  userNameText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emailText: { fontSize: 12, color: '#6B7280' },
  logoutButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', marginLeft: 10 },
  logoutButtonText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  googleLoginButton: { marginTop: 8, backgroundColor: '#4285F4', paddingVertical: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleLoginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(229, 231, 235, 0.5)', gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  settingDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  menuRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(229, 231, 235, 0.5)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuRowStatic: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(229, 231, 235, 0.5)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuRowDanger: { paddingVertical: 14, marginTop: 10 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  menuDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  menuLabelDanger: { fontSize: 15, fontWeight: '600', color: '#DC2626' },

  // 👇 [추가] 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  passwordInput: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    paddingVertical: 10,
    letterSpacing: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  modalConfirmBtn: {
    backgroundColor: PRIMARY,
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});