import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import CustomAlert from '../components/ui/CustomAlert';
import { COLORS } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from '../utils/responsive';
import { useProfileLogic } from '../hooks/screens/useProfileLogic';

const PRIMARY = 'rgb(219, 31, 38)';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const {
    userEmail,
    userInfo,
    nickname,
    isAuthenticated,
    isNicknameModalVisible,
    setIsNicknameModalVisible,
    nicknameInput,
    setNicknameInput,
    isForcedNickname,
    setIsForcedNickname,
    pushEnabled,
    soundEnabled,
    setSoundEnabled,
    nightPushOnly,
    setNightPushOnly,
    marketingEnabled,
    setMarketingEnabled,
    alertVisible,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    alertButtons,
    closeAlert,
    showAlert,
    isFeedbackModalVisible,
    setIsFeedbackModalVisible,
    feedbackInput,
    setFeedbackInput,
    isSendingFeedback,
    isLicenseModalVisible,
    setIsLicenseModalVisible,
    appVersion,
    handleFeedbackSubmit,
    handleLogout,
    handleNicknameSave,
    handleWithdraw,
    handleGoogleLogin,
    handlePushToggle,
  } = useProfileLogic();

  return (
    <LinearGradient
      colors={[COLORS.lightPink, COLORS.white]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.8 }}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity
        style={[styles.backButton, { top: Math.max(insets.top + 10, 20) }]}
        onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#111827" />
      </TouchableOpacity>
      <ScrollView
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
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
          <View style={styles.menuRowStatic}>
            <AppText style={styles.menuLabel}>버전</AppText>
            <AppText style={styles.menuDescription}>v{appVersion}</AppText>
          </View>

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
}

// 헬퍼 컴포넌트
interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}
function SettingRow({ label, description, value, onValueChange }: SettingRowProps) {
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
  backButton: {
    position: 'absolute',
    left: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
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
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: '#f0f0f0' },
  modalConfirmBtn: { backgroundColor: PRIMARY },
  modalCancelText: { color: '#333', fontWeight: '600' },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
});
