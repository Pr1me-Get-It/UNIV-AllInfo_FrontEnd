import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Switch,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/userService';
import { registerForPushNotificationsAsync, sendTestNotification } from '../utils/notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import CustomAlert from '../components/ui/CustomAlert';
import { saveData, getData } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { COLORS } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from '../utils/responsive';
import { isValidNickname } from '../utils/filter';
import { sendFeedback } from '../api/feedbackService';

const PRIMARY = 'rgb(219, 31, 38)';
const DEV_PASSWORD = '1557';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
    isLoading, // 로딩 상태
  } = useAuth(); //

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // 닉네임 관련 상태
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isForcedNickname, setIsForcedNickname] = useState(false);

  // Focus 시점에 닉네임 여부 검사
  useFocusEffect(
    React.useCallback(() => {
      // 로딩 중이 아니고, 로그인은 완료되었으나 닉네임이 없는 경우
      if (!isLoading && isAuthenticated && nickname === null && userInfo !== null) {
        setIsForcedNickname(true);
        setIsNicknameModalVisible(true);
      } else {
        setIsForcedNickname(false);
      }
    }, [isLoading, isAuthenticated, nickname, userInfo])
  );

  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightPushOnly, setNightPushOnly] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [devClickCount, setDevClickCount] = useState(0); // 개발자 모드 진입을 위한 클릭 카운트

  // 커스텀 알림 상태
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [alertButtons, setAlertButtons] = useState<any[] | undefined>(undefined);

  const showAlert = (title: string, message: string, onConfirm?: () => void, buttons?: any[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setAlertButtons(buttons);
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
    setAlertOnConfirm(undefined);
    setAlertButtons(undefined);
  };

  // 피드백 관련 상태
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // 라이선스 모달 상태
  const [isLicenseModalVisible, setIsLicenseModalVisible] = useState(false);

  // 피드백 전송 핸들러
  const handleFeedbackSubmit = async () => {
    if (!feedbackInput.trim()) {
      showAlert('알림', '내용을 입력해주세요.');
      return;
    }

    setIsSendingFeedback(true);
    try {
      // 실제 백엔드 API 호출
      await sendFeedback(feedbackInput);

      setIsFeedbackModalVisible(false);
      setFeedbackInput('');
      showAlert('감사합니다', '소중한 의견이 전달되었습니다. 🙇‍♂️');
    } catch (error: any) {
      console.error('[Feedback] 전송 실패 ❌', error?.response?.data ?? error?.message ?? error);
      showAlert('전송 실패', '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  // 2. 핸들러 함수들 (기존 로직 유지)
  const handlePasswordSubmit = () => {
    if (passwordInput === DEV_PASSWORD) {
      setIsPasswordModalVisible(false);
      setPasswordInput('');

      // 계정 선택 Alert 띄우기
      showAlert('테스트 계정 선택', '로그인할 테스트 계정을 선택해주세요.', undefined, [
        {
          text: 'Test 1 (기본)',
          onPress: () => loginDev(),
          style: 'default',
        },
        {
          text: 'Test 2 (추가)',
          onPress: () => loginDev('test2@knu.ac.kr'),
          style: 'default',
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ]);
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
    const input = nicknameInput.trim();
    if (!input) {
      showAlert('오류', '닉네임을 입력해주세요.');
      return;
    }

    if (!isValidNickname(input)) {
      showAlert('부적절한 닉네임', '비속어나 제한된 단어가 포함되어 있습니다.');
      return;
    }

    if (userEmail) {
      await updateNickname(input);
      setIsNicknameModalVisible(false);
      setNicknameInput('');
      showAlert('알림', '닉네임이 설정되었습니다.');
    }
  };

  // 회원 탈퇴 버튼 핸들러
  const handleWithdraw = () => {
    showAlert('회원 탈퇴', '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.', async () => {
      try {
        await withdraw();
        showAlert('알림', '회원 탈퇴가 완료되었습니다.');
      } catch (error) {
        showAlert('오류', '회원 탈퇴 처리에 실패했습니다.\n잠시 후 다시 시도해주세요.');
      }
    });
  };

  // [New] 구글 로그인 핸들러 (에러 핸들링 추가)
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      // AuthContext에서 throw된 에러를 여기서 잡아서 커스텀 알림 표시
      showAlert('로그인 오류', '구글 로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.');
    }
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
        const token = await registerForPushNotificationsAsync();

        if (token) {
          try {
            await registerUser(userEmail, token);

            showAlert('알림', '푸시 알림 설정이 완료되었습니다.');
          } catch (apiError: any) {
            // [수정] 409 Conflict (이미 등록된 유저)는 성공으로 처리
            if (apiError.response && apiError.response.status === 409) {
              showAlert('알림', '푸시 알림 설정이 완료되었습니다.'); // 사용자에게는 성공으로 표시
            } else {
              throw apiError; // 다른 에러는 catch 블록으로 전달
            }
          }
        } else {
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
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[COLORS.lightPink, COLORS.white]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.8 }}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        {/* 개발자 모드 비밀번호 모달 */}
        <Modal
          visible={isPasswordModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsPasswordModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <AppText style={styles.modalTitle}>개발자 모드 인증</AppText>
              <AppText style={styles.modalDesc}>비밀번호를 입력하세요.</AppText>
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
                  <AppText style={styles.modalCancelText}>취소</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalConfirmBtn]}
                  onPress={handlePasswordSubmit}>
                  <AppText style={styles.modalConfirmText}>확인</AppText>
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
          onRequestClose={() => {
            if (!isForcedNickname) {
              setIsNicknameModalVisible(false);
            }
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <AppText style={styles.modalTitle}>닉네임 설정</AppText>
              <AppText style={styles.modalDesc}>사용하실 닉네임을 입력하세요.</AppText>
              <TextInput
                style={styles.nicknameInput}
                placeholder="닉네임 (10자 이내)"
                value={nicknameInput}
                onChangeText={setNicknameInput}
                maxLength={10}
              />
              <View style={styles.modalButtons}>
                {!isForcedNickname && (
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancelBtn]}
                    onPress={() => {
                      setIsNicknameModalVisible(false);
                      setNicknameInput('');
                    }}>
                    <AppText style={styles.modalCancelText}>취소</AppText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalConfirmBtn]}
                  onPress={handleNicknameSave}>
                  <AppText style={styles.modalConfirmText}>저장</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* --- License Modal --- */}
        <Modal
          visible={isLicenseModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsLicenseModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsLicenseModalVisible(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <AppText style={styles.modalTitle}>오픈소스 라이선스</AppText>
              <ScrollView
                style={{ maxHeight: 300, width: '100%', marginBottom: 20 }}
                showsVerticalScrollIndicator={false}>
                <AppText style={{ fontSize: 13, color: '#4b5563', lineHeight: 22 }}>
                  본 애플리케이션은 다음과 같은 핵심 오픈소스 기술 스택을 활용하고 있습니다:{'\n\n'}
                  • React Native (0.81){'\n'}• Expo (SDK 54){'\n'}• React Navigation (v7){'\n'}• React
                  Query (@tanstack/react-query v5){'\n'}• React Native Reanimated (v4){'\n'}•
                  React Native Naver Map (@mj-studio){'\n'}• Matter.js (물리 엔진)
                  {'\n'}• React Native Calendars{'\n'}• badwords-ko (비속어 필터){'\n'}• React Native Draggable Grid
                  {'\n'}• Axios{'\n'}• Expo Image / Linear Gradient / Notifications{'\n'}
                  {'\n'}각 프로젝트의 라이선스 원문은 해당 공식 저장소에서 확인 가능합니다.
                </AppText>
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => setIsLicenseModalVisible(false)}>
                  <AppText style={styles.modalCancelText}>닫기</AppText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* 피드백 모달 */}
        <Modal
          visible={isFeedbackModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsFeedbackModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: '85%' }]}>
              <AppText style={styles.modalTitle}>피드백 보내기 📮</AppText>
              <AppText style={styles.modalDesc}>
                버그 제보, 기능 건의 등 자유롭게 남겨주세요.
              </AppText>

              <TextInput
                style={[styles.feedbackInput, { height: 120, textAlignVertical: 'top' }]}
                multiline
                placeholder="여기에 내용을 입력하세요..."
                value={feedbackInput}
                onChangeText={setFeedbackInput}
                maxLength={500}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => {
                    setIsFeedbackModalVisible(false);
                    setFeedbackInput('');
                  }}
                  disabled={isSendingFeedback}>
                  <AppText style={styles.modalCancelText}>취소</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    styles.modalConfirmBtn,
                    isSendingFeedback && { opacity: 0.7 },
                  ]}
                  onPress={handleFeedbackSubmit}
                  disabled={isSendingFeedback}>
                  {isSendingFeedback ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <AppText style={styles.modalConfirmText}>보내기</AppText>
                  )}
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
                  source={require('../assets/user.webp')}
                  style={[styles.profileImage, { backgroundColor: '#F3F4F6' }]}
                />
                <View>
                  <AppText style={styles.welcomeText}>로그인됨</AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AppText style={styles.userNameText}>
                      {isForcedNickname ? '닉네임 설정 중...' : (nickname || userInfo?.name || '사용자') + ' 님'}
                    </AppText>
                  </View>
                  <AppText style={styles.emailText}>{userEmail}</AppText>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.logoutButton,
                  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
                ]}
                onPress={() => {
                  setNicknameInput(nickname || userInfo?.name || '');
                  setIsForcedNickname(false);
                  setIsNicknameModalVisible(true);
                }}>
                <Ionicons name="pencil" size={14} color="#374151" />
                <AppText style={styles.logoutButtonText}>수정</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loginCard}>
              <AppText style={styles.sectionTitle}>로그인</AppText>
              <AppText style={styles.sectionDescription}>
                학교 공지를 개인화해서 받고 캘린더를 연동하려면 로그인하세요.
              </AppText>
              <View style={styles.loginButtonsContainer}>
                {/* Google */}
                <TouchableOpacity
                  style={[styles.snsIconBtn, { backgroundColor: '#4285F4' }]}
                  onPress={handleGoogleLogin}>
                  <Ionicons name="logo-google" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Apple (Placeholder) */}
                <TouchableOpacity
                  style={[styles.snsIconBtn, { backgroundColor: '#000' }]}
                  onPress={() => showAlert('알림', 'Apple 로그인은 준비 중입니다.')}>
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 알림 설정 섹션 */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>알림 설정</AppText>
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
          <AppText style={styles.sectionTitle}>공지 · 홍보</AppText>
          <SettingRow
            label="행사/대외활동 홍보 허용"
            description="학교/동아리 행사, 대외활동 홍보 알림을 받습니다."
            value={marketingEnabled}
            onValueChange={setMarketingEnabled}
          />
        </View>

        {/* 앱 정보 섹션 */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>앱 정보</AppText>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.menuRowStatic}
            onPress={() => {
              setDevClickCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 7) {
                  setIsPasswordModalVisible(true);
                  return 0;
                }
                return newCount;
              });
            }}>
            <AppText style={styles.menuLabel}>버전</AppText>
            <AppText style={styles.menuDescription}>v{appVersion}</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => sendTestNotification()}>
            <View>
              <AppText style={styles.menuLabel}>푸시 알림 테스트</AppText>
              <AppText style={styles.menuDescription}>내 폰으로 테스트 알림을 보냅니다.</AppText>
            </View>
            <Ionicons name="notifications" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* 회원 탈퇴 (최하단) */}
        {isAuthenticated && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>기타</AppText>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setIsFeedbackModalVisible(true)}>
              <View>
                <AppText style={styles.menuLabel}>피드백 보내기</AppText>
                <AppText style={styles.menuDescription}>
                  버그 제보, 기능 요청 등을 전달합니다.
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => setIsLicenseModalVisible(true)}>
              <View>
                <AppText style={styles.menuLabel}>오픈소스 라이선스</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
              <View>
                <AppText style={styles.menuLabel}>로그아웃</AppText>
                <AppText style={styles.menuDescription}>계정에서 로그아웃합니다.</AppText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleWithdraw}>
              <View>
                <AppText style={styles.menuLabel}>회원 탈퇴</AppText>
                <AppText style={styles.menuDescription}>계정 정보를 삭제하고 탈퇴합니다.</AppText>
              </View>
            </TouchableOpacity>
          </View>
        )}
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={closeAlert}
          onConfirm={alertOnConfirm}
          buttons={alertButtons}
        />
      </ScrollView>
    </LinearGradient>
  );
} // 👈 ProfileScreen 함수 끝 (여기서 닫아줘야 스타일이 적용됩니다.)

// 헬퍼 컴포넌트
function SettingRow({ label, description, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <AppText style={styles.settingLabel}>{label}</AppText>
        {!!description && <AppText style={styles.settingDescription}>{description}</AppText>}
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
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 100 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: moderateScale(18, 0.3),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    includeFontPadding: false,
  },
  sectionDescription: {
    fontSize: moderateScale(13, 0.3),
    color: '#6B7280',
    marginBottom: 6,
    includeFontPadding: false,
    lineHeight: moderateScale(18, 0.3),
  },
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
  snsIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  loginButtonsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    gap: 12,
  },
  settingLabel: {
    fontSize: moderateScale(15, 0.3),
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
    includeFontPadding: false,
  },
  settingDescription: {
    fontSize: moderateScale(12, 0.3),
    color: '#6B7280',
    includeFontPadding: false,
    lineHeight: moderateScale(16, 0.3),
  },
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
  menuLabel: {
    fontSize: moderateScale(16, 0.3),
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
    includeFontPadding: false,
  },
  menuDescription: {
    fontSize: moderateScale(13, 0.3),
    color: '#6B7280',
    includeFontPadding: false,
    lineHeight: moderateScale(18, 0.3),
  },
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
  feedbackInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    color: '#111',
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
