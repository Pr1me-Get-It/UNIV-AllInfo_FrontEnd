import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Switch,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/userService';
import { registerForPushNotificationsAsync, sendTestNotification } from '../utils/notifications';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../components/ui/CustomAlert';
import { saveData, getData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

const PRIMARY = 'rgb(219, 31, 38)';
const DEV_PASSWORD = '1557';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  // 1. 모든 훅(useState, useAuth 등)은 반드시 최상단에 모여야 합니다.
  const {
    userEmail,
    userInfo,
    nickname, // from Context
    isAuthenticated,
    loginWithGoogle, // 구글 로그인 함수
    loginDev, // 개발자 로그인 함수
    logout,
    withdraw, // 회원 탈퇴
    updateNickname, // 닉네임 업데이트 함수
  } = useAuth(); //

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // 닉네임 관련 상태
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightPushOnly, setNightPushOnly] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  // 커스텀 알림 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
    setAlertOnConfirm(undefined);
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  // 2. 핸들러 함수들 (기존 로직 유지)
  const handlePasswordSubmit = () => {
    if (passwordInput === DEV_PASSWORD) {
      setIsPasswordModalVisible(false);
      setPasswordInput('');

      // 계정 선택 Alert 띄우기
      Alert.alert(
        '테스트 계정 선택',
        '로그인할 테스트 계정을 선택해주세요.',
        [
          {
            text: 'Test 1 (기본)',
            onPress: () => loginDev(), // 인자 없으면 기본값(config의 DEV_EMAIL)
          },
          {
            text: 'Test 2 (추가)',
            onPress: () => loginDev('test2@knu.ac.kr'),
          },
          {
            text: '취소',
            style: 'cancel',
          },
        ]
      );
    } else {
      showAlert('오류', '비밀번호가 틀렸습니다.');
    }
  };

  const handleLogout = () => {
    console.log('🚩 [ProfileScreen] 로그아웃 버튼 클릭됨');
    // [변경] 커스텀 알림창으로 로그아웃 확인
    showAlert('로그아웃', '로그아웃 하시겠습니까?', () => {
      console.log("🚩 [ProfileScreen] 로그아웃 '확인' 누름 -> AuthContext.logout 호출");
      setPushEnabled(false); // [수정] 로그아웃 시 푸시 알림 비활성화
      logout();
    });
  };

  // [New] Load saved push setting
  useEffect(() => {
    const loadPushSetting = async () => {
      if (userEmail) {
        const safeEmail = userEmail.replace(/\./g, '_');
        const savedSetting = await getData(STORAGE_KEYS.PUSH_SETTING(safeEmail));
        if (savedSetting !== null) {
          setPushEnabled(savedSetting === 'true');
        }
      } else {
        setPushEnabled(false);
      }
    };
    loadPushSetting();
  }, [userEmail]);

  // 닉네임 저장 핸들러
  const handleNicknameSave = async () => {
    if (!nicknameInput.trim()) {
      showAlert('오류', '닉네임을 입력해주세요.');
      return;
    }

    if (userEmail) {
      await updateNickname(nicknameInput.trim());
      setIsNicknameModalVisible(false);
      setNicknameInput('');
      showAlert('알림', '닉네임이 설정되었습니다.');
    }
  };

  // 회원 탈퇴 버튼 핸들러
  const handleWithdraw = () => {
    showAlert('회원 탈퇴', '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.', () => {
      withdraw();
    });
  };

  const handlePushToggle = async value => {
    if (!isAuthenticated) {
      showAlert('로그인 필요', '푸시 알림을 받으려면 로그인이 필요합니다.');
      setPushEnabled(false);
      return;
    }

    setPushEnabled(value);

    // [New] Save setting
    if (userEmail) {
      const safeEmail = userEmail.replace(/\./g, '_');
      await saveData(STORAGE_KEYS.PUSH_SETTING(safeEmail), String(value));
    }

    if (value) {
      try {
        // console.log("🚀 [PushDebug] 푸시 알림 설정 시작...");
        const token = await registerForPushNotificationsAsync();
        // console.log("🚀 [PushDebug] 토큰 발급 결과:", token);

        if (token) {
          // console.log("🚀 [PushDebug] 서버로 토큰 전송 시도:", userEmail);
          try {
            await registerUser(userEmail, token);
            // console.log("🚀 [PushDebug] 서버 등록 완료!");
            showAlert('알림', '푸시 알림 설정이 완료되었습니다.');
          } catch (apiError: any) {
            // [수정] 409 Conflict (이미 등록된 유저)는 성공으로 처리
            if (apiError.response && apiError.response.status === 409) {
              // console.log("🚀 [PushDebug] 이미 등록된 토큰/유저 (409) -> 성공 처리");
              showAlert('알림', '푸시 알림 설정이 완료되었습니다.'); // 사용자에게는 성공으로 표시
            } else {
              throw apiError; // 다른 에러는 catch 블록으로 전달
            }
          }
        } else {
          // console.log("🚀 [PushDebug] 토큰이 없어 서버 등록 스킵");
          showAlert('오류', '푸시 토큰을 가져올 수 없습니다.');
          setPushEnabled(false);
          // Revert save if failed
          if (userEmail) {
            const safeEmail = userEmail.replace(/\./g, '_');
            await saveData(STORAGE_KEYS.PUSH_SETTING(safeEmail), 'false');
          }
        }
      } catch (e) {
        console.error('🚀 [PushDebug] 에러 발생:', e);
        setPushEnabled(false);
        // Revert save if failed
        if (userEmail) {
          const safeEmail = userEmail.replace(/\./g, '_');
          await saveData(STORAGE_KEYS.PUSH_SETTING(safeEmail), 'false');
        }
        showAlert('오류', '푸시 알림 설정 중 문제가 발생했습니다.');
      }
    }
  };

  // 3. UI 렌더링 (기존 배치 100% 유지)
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* 개발자 모드 비밀번호 모달 */}
      <Modal
        visible={isPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPasswordModalVisible(false)}>
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
                }}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handlePasswordSubmit}>
                <Text style={styles.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 닉네임 설정 모달 */}
      <Modal
        visible={isNicknameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNicknameModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>닉네임 설정</Text>
            <Text style={styles.modalDesc}>사용하실 닉네임을 입력하세요.</Text>
            <TextInput
              style={styles.nicknameInput}
              placeholder="닉네임 (10자 이내)"
              value={nicknameInput}
              onChangeText={setNicknameInput}
              maxLength={10}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setIsNicknameModalVisible(false);
                  setNicknameInput('');
                }}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handleNicknameSave}>
                <Text style={styles.modalConfirmText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 로그인/프로필 카드 */}
      <View style={styles.section}>
        {isAuthenticated ? (
          <View style={styles.loginCardLoggedIn}>
            <View style={styles.profileInfo}>
              <Image
                source={require('../assets/user.png')}
                style={[styles.profileImage, { backgroundColor: '#F3F4F6' }]}
              />
              <View>
                <Text style={styles.welcomeText}>로그인됨</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.userNameText}>{nickname || userInfo?.name || '사용자'} 님</Text>
                </View>
                <Text style={styles.emailText}>{userEmail}</Text>
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
              학교 공지를 개인화해서 받고 캘린더를 연동하려면 로그인하세요.
            </Text>
            <TouchableOpacity style={styles.googleLoginButton} onPress={loginWithGoogle}>
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleLoginButtonText}>Google로 로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.googleLoginButton, { backgroundColor: '#333', marginTop: 10 }]}
              onPress={() => setIsPasswordModalVisible(true)} // 👈 비밀번호 모달을 띄우도록 수정
            >
              <Ionicons name="code-slash" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleLoginButtonText}>개발자 로그인 (Test)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/*맞춤형 서비스 섹션*/}


      {/* 알림 설정 섹션 */}
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

      {/* 공지 · 홍보 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>공지 · 홍보</Text>
        <SettingRow
          label="행사/대외활동 홍보 허용"
          description="학교/동아리 행사, 대외활동 홍보 알림을 받습니다."
          value={marketingEnabled}
          onValueChange={setMarketingEnabled}
        />
      </View>

      {/* 계정 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => {
            setNicknameInput(nickname || userInfo?.name || '');
            setIsNicknameModalVisible(true);
          }}>
          <View>
            <Text style={styles.menuLabel}>닉네임 설정</Text>
            <Text style={styles.menuDescription}>앱 내에서 표시될 닉네임을 설정합니다.</Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRowDanger} onPress={handleWithdraw}>
          <View>
            <Text style={styles.menuLabelDanger}>회원 탈퇴</Text>
            <Text style={styles.menuDescription}>계정 정보를 삭제하고 탈퇴합니다.</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 앱 정보 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.menuRowStatic}>
          <Text style={styles.menuLabel}>버전</Text>
          <Text style={styles.menuDescription}>v{appVersion}</Text>
        </View>
        <TouchableOpacity style={styles.menuRow} onPress={() => sendTestNotification()}>
          <View>
            <Text style={styles.menuLabel}>푸시 알림 테스트</Text>
            <Text style={styles.menuDescription}>내 폰으로 테스트 알림을 보냅니다.</Text>
          </View>
          <Ionicons name="notifications" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuRow} onPress={() => showAlert('피드백', '준비 중')}>
          <View>
            <Text style={styles.menuLabel}>피드백 보내기</Text>
            <Text style={styles.menuDescription}>버그 제보, 기능 요청 등을 전달합니다.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={closeAlert}
        onConfirm={alertOnConfirm}
      />
    </ScrollView>
  );
} // 👈 ProfileScreen 함수 끝 (여기서 닫아줘야 스타일이 적용됩니다.)

// 헬퍼 컴포넌트
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
        trackColor={{ false: '#E5E7EB', true: PRIMARY }}
        thumbColor={'#fff'}
      />
    </View>
  );
}

// 스타일 시트
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 30 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sectionDescription: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  loginCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 3 },
  loginCardLoggedIn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  welcomeText: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  userNameText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emailText: { fontSize: 12, color: '#6B7280' },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginLeft: 10,
  },
  logoutButtonText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  googleLoginButton: {
    marginTop: 8,
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLoginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    gap: 12,
  },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  settingDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  menuRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuRowStatic: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalDesc: { fontSize: 14, color: '#666', marginBottom: 20 },
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
  nicknameInput: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: '#f0f0f0' },
  modalConfirmBtn: { backgroundColor: PRIMARY },
  modalCancelText: { color: '#333', fontWeight: '600' },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
  topActionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 22,
    marginBottom: 15,
    marginTop: -10,
  },
});
