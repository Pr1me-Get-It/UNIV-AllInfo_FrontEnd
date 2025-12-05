import React, { useState, useEffect, useContext } from 'react';
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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { saveToken, getToken, removeToken } from '../utils/storage';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { api } from '../api/client';
import { AlramContext } from '../data/Alram'; 

const PRIMARY = 'rgb(219, 31, 38)';
const DEV_USER = {
  email: "TheZZok@knuThe.ac.kr",
  name: "개발자",
  picture: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
};
const DEV_TOKEN = "DEV_MODE_ACCESS_TOKEN";
const DEV_PASSWORD = "1557"; 

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Context에서 로그인/로그아웃 함수 가져오기
  const { loginUser, logoutUser } = useContext(AlramContext);

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const appVersion = Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || "1.0.0";

  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightPushOnly, setNightPushOnly] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  // 1. 초기 설정: 구글 로그인 설정 & 자동 로그인 체크
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      // 캘린더 권한을 포함한 스코프 설정
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'], 
    });

    checkLoginStatus();
  }, []);

  // 앱 실행 시 로그인 상태 확인 (자동 로그인)
  const checkLoginStatus = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        setUserInfo(null);
        setLoading(false);
        return;
      }

      // 1. 개발자 모드 확인
      if (token === DEV_TOKEN) {
        setUserInfo(DEV_USER);
        loginUser(DEV_USER.email); // Context 동기화
        setLoading(false);
        return;
      }

      // 2. 구글 네이티브 자동 로그인 (권한/세션 복구)
      try {
        const response = await GoogleSignin.signInSilently();
        
        if (response && response.data && response.data.user) {
           const user = response.data.user;
           const userObj = {
              email: user.email,
              name: user.name,
              picture: user.photo, 
           };
           
           setUserInfo(userObj);
           loginUser(user.email); // Context 동기화
           
           // 토큰 갱신 및 재저장
           const { accessToken } = await GoogleSignin.getTokens();
           if (accessToken) {
              await saveToken(accessToken);
           }
        } else {
           // 로그인 정보가 없으면 초기화
           throw new Error("No user data");
        }
      } catch (e) {
        console.log("Silent login failed (session expired):", e.code);
        // 세션 만료 시 로그아웃 처리
        setUserInfo(null);
        await removeToken();
        logoutUser(); 
      }

    } catch (e) {
      console.log("Login check error:", e);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 구글 로그인 버튼 핸들러
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        const newUserInfo = {
            email: user.email,
            name: user.name,
            picture: user.photo, 
        };

        setUserInfo(newUserInfo);
        loginUser(newUserInfo.email); // Context 동기화

        const { accessToken } = await GoogleSignin.getTokens();
        if (accessToken) {
            await saveToken(accessToken);
        }

        console.log("구글 로그인 성공:", newUserInfo.email);
        
        // 백엔드에 유저 등록 (선택 사항: 키워드 기능 등을 위해)
        try {
            await api.post('/user/register', { 
                email: newUserInfo.email, 
                expoPushToken: null 
            });
        } catch(e) {}
      } 

    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // 사용자 취소
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("오류", "Google Play 서비스를 사용할 수 없습니다.");
      } else {
        Alert.alert("오류", "로그인 실패: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 개발자 모드 로그인 로직
  const performDevLogin = async () => {
    setLoading(true);
    try {
      await saveToken(DEV_TOKEN);
      setUserInfo(DEV_USER);
      loginUser(DEV_USER.email); // Context 동기화

      console.log(`📡 개발자 계정 등록: ${DEV_USER.email}`);
      try {
         await api.post('/user/register', { 
           email: DEV_USER.email, 
           expoPushToken: null 
         });
      } catch (e) {}

      Alert.alert("성공", "개발자 모드(test@knu.ac.kr)로 로그인되었습니다.");
    } catch (e) {
      console.error(e);
      Alert.alert("에러", "개발자 로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === DEV_PASSWORD) {
      setIsPasswordModalVisible(false);
      setPasswordInput('');
      performDevLogin();
    } else {
      Alert.alert("오류", "비밀번호가 틀렸습니다.");
    }
  };

  // 로그아웃 로직 (권한 초기화 포함)
  const executeLogout = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      // 1. 구글 권한 연결 끊기 (Revoke) - 재로그인 시 권한 묻게 함
      try {
        await GoogleSignin.revokeAccess(); 
        await GoogleSignin.signOut();
      } catch (e) {
        console.log("SignOut/Revoke error (ignored):", e);
      }

      // 2. 기존 방식의 토큰 만료 요청 (보조)
      if (token && token !== DEV_TOKEN) {
        fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }).catch(() => {});
      }
    } catch (e) {
      console.error("로그아웃 에러:", e);
    } finally {
      // 3. 로컬 데이터 및 상태 초기화
      await removeToken();
      setUserInfo(null);
      setPushEnabled(false);
      logoutUser(); // Context 상태 초기화
      setLoading(false);
    }
  };

  const handleLogout = () => {
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

  const handleFeedback = () => {
    Alert.alert('피드백', '팀 Notion 또는 GitHub 이슈에 남겨주세요!');
  };

  const handlePushToggle = async (value) => {
    if (!userInfo) {
      Alert.alert("로그인 필요", "푸시 알림을 받으려면 로그인이 필요합니다.");
      setPushEnabled(false);
      return;
    }

    setPushEnabled(value); 
    
    if (value) {
      let tokenData = null;
      try {
        tokenData = await registerForPushNotificationsAsync();
      } catch (err) {
        console.log("푸시 토큰 에러:", err);
        setPushEnabled(false);
        return;
      }

      const token = typeof tokenData === "string" ? tokenData : tokenData?.data;

      if (!token) {
        setPushEnabled(false);
        return;
      }

      try {
        const response = await api.post('/user/register', {
          email: userInfo.email,
          expoPushToken: token
        });
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
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 140 }}>
      
      {/* 개발자 모드 비밀번호 모달 */}
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
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleLoginButtonText}>Google로 로그인</Text>
            </TouchableOpacity>
            
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