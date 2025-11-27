// Calculator.jsx → "설정" 화면으로 사용
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';

const PRIMARY = 'rgb(219, 31, 38)';

export default function Calculator() {
  // 로그인 관련 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // 설정 스위치들
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightPushOnly, setNightPushOnly] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('로그인 실패', '이메일과 비밀번호를 모두 입력해주세요.');
    }

    // 간단한 더미 검증 (실제 백엔드 연동 전까지)
    const nameFromEmail = email.split('@')[0] || '사용자';
    setUserName(nameFromEmail);
    setLoggedIn(true);
    setPassword('');
    Alert.alert('로그인 완료', `${nameFromEmail}님, 환영합니다!`);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail('');
    setPassword('');
    setUserName('');
  };

  const handleChangeEmail = () => {
    Alert.alert('안내', '학교 이메일 변경 기능은 이후 백엔드와 연동할 예정입니다.');
  };

  const handleChangePassword = () => {
    Alert.alert('안내', '비밀번호 변경 기능은 이후 백엔드와 연동할 예정입니다.');
  };

  const handleFeedback = () => {
    Alert.alert(
      '피드백',
      '불편한 점이나 개선 아이디어가 있다면\n팀 Notion 또는 GitHub 이슈에 남겨주세요!'
    );
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 맨 위: 로그인 카드 */}
      <View style={styles.section}>
        {loggedIn ? (
          <View style={styles.loginCardLoggedIn}>
            <View>
              <Text style={styles.welcomeText}>로그인됨</Text>
              <Text style={styles.userNameText}>{userName} 님</Text>
              {!!email && <Text style={styles.emailText}>{email}</Text>}
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginCard}>
            <Text style={styles.sectionTitle}>로그인</Text>
            <Text style={styles.sectionDescription}>
              학교 공지를 개인화해서 받으려면 KNU 이메일로 로그인하세요.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="학교 이메일 (예: knu@knu.ac.kr)"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>로그인</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 알림 설정 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림 설정</Text>
        <SettingRow
          label="푸시 알림 받기"
          description="중요 공지, 마감 알림 등을 푸시로 받아요."
          value={pushEnabled}
          onValueChange={setPushEnabled}
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

      {/* 공지/마케팅 섹션 */}
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

        <TouchableOpacity style={styles.menuRow} onPress={handleChangeEmail}>
          <View>
            <Text style={styles.menuLabel}>학교 이메일 변경</Text>
            <Text style={styles.menuDescription}>로그인에 사용하는 이메일을 수정합니다.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={handleChangePassword}>
          <View>
            <Text style={styles.menuLabel}>비밀번호 변경</Text>
            <Text style={styles.menuDescription}>현재 비밀번호를 변경합니다.</Text>
          </View>
        </TouchableOpacity>

        {loggedIn && (
          <TouchableOpacity style={styles.menuRowDanger} onPress={handleLogout}>
            <Text style={styles.menuLabelDanger}>로그아웃</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 앱 정보 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.menuRowStatic}>
          <Text style={styles.menuLabel}>버전</Text>
          <Text style={styles.menuDescription}>v1.0.0 (프론트엔드 팀 데모)</Text>
        </View>

        <TouchableOpacity style={styles.menuRow} onPress={handleFeedback}>
          <View>
            <Text style={styles.menuLabel}>피드백 보내기</Text>
            <Text style={styles.menuDescription}>
              버그 제보, 기능 요청, UI 의견 등을 개발 팀에게 전달합니다.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 개별 설정 항목(스위치) 컴포넌트
function SettingRow({ label, description, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {!!description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} thumbColor="#fff" />
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
  section: {
    marginBottom: 18,
  },

  // 로그인 카드
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  loginCardLoggedIn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emailText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  logoutButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },

  primaryButton: {
    marginTop: 4,
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // 스위치 설정 행
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // 메뉴 행(터치 가능한 줄)
  menuRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuRowStatic: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuRowDanger: {
    paddingVertical: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  menuDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menuLabelDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
});
