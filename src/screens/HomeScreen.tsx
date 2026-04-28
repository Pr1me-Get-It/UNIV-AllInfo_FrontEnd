import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import AppText from '../components/AppText';
import { moderateScale } from '../utils/responsive';
import CustomAlert from '../components/ui/CustomAlert';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import MealWidget from '../components/home/MealWidget';
import BusWidget from '../components/home/BusWidget';
import { useHomeLogic } from '../hooks/screens/useHomeLogic';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTab'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const CARD_SPACING = 15;
const CARD_WIDTH = (width - 40 - CARD_SPACING) / 2;

export default function HomeScreen({ navigation }: Props) {
  const {
    nickname,
    customLinks,
    isNicknameModalVisible,
    setIsNicknameModalVisible,
    nicknameInput,
    setNicknameInput,
    searchText,
    setSearchText,
    searchResults,
    setSearchResults,
    alertVisible,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    alertButtons,
    closeAlert,
    fadeAnim,
    handleSearchResultPress,
    handleNicknamePress,
    handleNicknameSave,
    handleOpenLink,
    handleSearchSubmit,
  } = useHomeLogic(navigation);

  return (
    <LinearGradient
      colors={[COLORS.lightPink, COLORS.white]}
      style={styles.page}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.8 }}>
      {/* 상단 헤더 섹션 */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <AppText style={styles.headerTitle}>
              안녕하세요 {nickname ? ` ${nickname}님 : )` : ': )'}
            </AppText>
          </Animated.View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={28} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 검색바 섹션 */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="무엇이 궁금하신가요?"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchText(''); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          {/* 검색 결과 제안 목록 */}
          {searchResults.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSearchResultPress(item)}>
                  <View style={styles.suggestionIconWrapper}>
                    <Ionicons name={(item.icon as any) || 'link-outline'} size={18} color={COLORS.primary} />
                  </View>
                  <AppText style={styles.suggestionText}>{item.title}</AppText>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 바로가기 메뉴 섹션 (Pill-shaped) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutScrollContent}
          style={styles.shortcutScroll}>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => navigation.navigate('MainTab', { screen: 'Map' })}
            activeOpacity={0.8}>
            <Ionicons name="map" size={16} color="#0284C7" style={{ marginRight: 6 }} />
            <AppText style={styles.pillText}>학교 지도</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => navigation.navigate('AppleGame')}
            activeOpacity={0.8}>
            <Ionicons name="nutrition" size={16} color="#16A34A" style={{ marginRight: 6 }} />
            <AppText style={styles.pillText}>두쫀쿠게임</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => navigation.navigate('FlappyBird')}
            activeOpacity={0.8}>
            <Ionicons name="rocket" size={16} color="#D97706" style={{ marginRight: 6 }} />
            <AppText style={styles.pillText}>플래피 버드</AppText>
          </TouchableOpacity>
        </ScrollView>

        {/* 링크 그리드 (바로가기 서비스) 및 홈 화면 설정 버튼 */}
        <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <AppText style={styles.sectionTitle}>바로가기 서비스</AppText>
          <TouchableOpacity
            style={styles.inlineSettingButton}
            onPress={() => navigation.navigate('LinkSetting')}
            activeOpacity={0.8}>
            <AppText style={styles.inlineSettingButtonText}>커스텀</AppText>
          </TouchableOpacity>
        </View>
        <View style={styles.gridWrapper}>
          <View style={styles.gridContainer}>
            {customLinks.map(link => (
              <TouchableOpacity
                key={link.id}
                style={styles.linkCard}
                onPress={() => handleOpenLink(link.url)}
                activeOpacity={0.7}>
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name={(link.icon as any) || 'link-outline'}
                    size={28}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.textContainer}>
                  <AppText style={styles.linkText} numberOfLines={2}>
                    {link.title}
                  </AppText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 맞춤형 서비스 섹션 */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>맞춤형 서비스</AppText>
        </View>
        <View style={styles.gridWrapper}>
          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate('Keyword')}
              activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <Ionicons name="notifications-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.textContainer}>
                <AppText style={styles.linkText} numberOfLines={2}>
                  키워드 알림
                </AppText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate('Bookmark')}
              activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <Ionicons name="bookmark-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.textContainer}>
                <AppText style={styles.linkText} numberOfLines={2}>
                  즐겨 찾기
                </AppText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkCard}
              onPress={handleNicknamePress}
              activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                <Ionicons name="person-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.textContainer}>
                <AppText style={styles.linkText} numberOfLines={2}>
                  닉네임 변경
                </AppText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 오늘의 학식 위젯 */}
        <MealWidget />

        {/* 캠퍼스 이동 (버스/셔틀) 위젯 */}
        <BusWidget />

      </ScrollView>

      {/* 닉네임 설정 모달 */}
      <Modal
        visible={isNicknameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNicknameModalVisible(false)}>
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
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setIsNicknameModalVisible(false);
                  setNicknameInput('');
                }}>
                <AppText style={styles.modalCancelText}>취소</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handleNicknameSave}>
                <AppText style={styles.modalConfirmText}>저장</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 커스텀 알림 */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={closeAlert}
        onConfirm={alertOnConfirm}
        buttons={alertButtons}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 60, // Status bar area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(26, 0.3),
    fontWeight: 'bold',
    color: '#111',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // 하단 탭 바에 가리지 않도록 넉넉하게 여백 추가
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15, 0.3),
    color: '#111',
    padding: 0,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  suggestionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(219, 31, 38, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: moderateScale(20, 0.3),
    fontWeight: 'bold',
    color: '#111',
  },
  gridWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  linkCard: {
    width: '25%', // 4 columns per row
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  iconWrapper: {
    width: moderateScale(48, 0.3),
    height: moderateScale(48, 0.3),
    borderRadius: 16,
    backgroundColor: 'rgba(219, 31, 38, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  linkText: {
    fontSize: moderateScale(12, 0.3),
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    lineHeight: moderateScale(16, 0.3),
  },
  shortcutScroll: {
    marginBottom: 15,
    maxHeight: 60,
  },
  shortcutScrollContent: {
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 8,
    alignItems: 'center',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999, // Pill shape
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  pillText: {
    fontSize: moderateScale(13, 0.3),
    fontWeight: '600',
    color: '#333',
    includeFontPadding: false,
  },
  section: { marginBottom: 25 },
  inlineSettingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inlineSettingButtonText: {
    fontSize: moderateScale(12, 0.3),
    color: '#4B5563',
    fontWeight: '600',
  },
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
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: '#f0f0f0' },
  modalConfirmBtn: { backgroundColor: COLORS.primary },
  modalCancelText: { color: '#333', fontWeight: '600' },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
});

