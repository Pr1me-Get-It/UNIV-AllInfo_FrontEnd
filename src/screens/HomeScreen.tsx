import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { EXTERNAL_LINKS } from '../constants/links';
import { COLORS } from '../constants/colors';
import { CustomText } from '../components/ui/CustomText';
import { useAuth } from '../context/AuthContext';
import { moderateScale } from '../utils/responsive';

const { width } = Dimensions.get('window');
const CARD_SPACING = 15;
const CARD_WIDTH = (width - 40 - CARD_SPACING) / 2; // 2 columns

export default function HomeScreen({ navigation }: any) {
  const { nickname } = useAuth();

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('에러', '연결할 수 없는 링크입니다.');
      }
    } catch (error) {
      console.error('An error occurred', error);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.lightPink, COLORS.white]}
      style={styles.page}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.8 }}
    >
      {/* 상단 헤더 섹션 */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <CustomText style={styles.headerTitle}>
            안녕하세요 {nickname ? ` ${nickname}님 : )` : ': )'}
          </CustomText>
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
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="무엇이 궁금하신가요?"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={() => Alert.alert('검색', '준비 중입니다.')}
          />
        </View>

        {/* 링크 그리드 */}
        <View style={styles.gridContainer}>
          {EXTERNAL_LINKS.map(link => (
            <TouchableOpacity
              key={link.id}
              style={styles.linkCard}
              onPress={() => handleOpenLink(link.url)}
              activeOpacity={0.9}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={(link.icon as any) || 'link-outline'}
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.textContainer}>
                <CustomText style={styles.linkText}>{link.title}</CustomText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 맞춤형 서비스 섹션 */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>맞춤형 서비스</CustomText>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Keyword')}>
            <View>
              <CustomText style={styles.menuLabel}>키워드 설정</CustomText>
              <CustomText style={styles.menuDescription}>관심있는 키워드로 개인화된 공지를 받습니다.</CustomText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Bookmark')}>
            <View>
              <CustomText style={styles.menuLabel}>즐겨 찾기</CustomText>
              <CustomText style={styles.menuDescription}>내가 찜한 컨텐츠들.</CustomText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    // backgroundColor: '#fff', // Removed for gradient
    paddingTop: 60, // Status bar area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Add subtle border for visibility on white background
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 25,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15, 0.3),
    color: '#111',
    padding: 0, // Android 텍스트 패딩 제거
  },
  sectionTitle: {
    fontSize: moderateScale(22, 0.3),
    fontWeight: 'bold',
    color: '#111',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  linkCard: {
    width: CARD_WIDTH,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 15,
    marginBottom: CARD_SPACING,
    justifyContent: 'center', // Changed from space-between to center
    alignItems: 'flex-start', // Align items to left
    height: 100,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconWrapper: {
    width: moderateScale(36, 0.3),
    height: moderateScale(36, 0.3),
    borderRadius: 10,
    backgroundColor: 'rgba(219, 31, 38, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Added margin bottom to separate from text
  },
  textContainer: {
    width: '100%',
  },
  linkText: {
    fontSize: moderateScale(14, 0.3), // Slightly reduced
    fontWeight: '700',
    color: '#333',
    lineHeight: moderateScale(20, 0.3),
  },
  section: { marginBottom: 25 },
  menuRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: moderateScale(16, 0.3),
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
    includeFontPadding: false, // Android excess padding removal
  },
  menuDescription: {
    fontSize: moderateScale(13, 0.3),
    color: '#6B7280',
    includeFontPadding: false, // Android excess padding removal
    lineHeight: moderateScale(18, 0.3),
  },
});
