import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXTERNAL_LINKS } from '../constants/links';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');
const CARD_SPACING = 15;
const CARD_WIDTH = (width - 40 - CARD_SPACING) / 2; // 2 columns

export default function HomeScreen() {
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
    <View style={styles.page}>
      {/* 상단 헤더 섹션 */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/cow.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={styles.appName}>KNU INFO</Text>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => Alert.alert('검색', '준비 중입니다.')}
          activeOpacity={0.7}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 섹션 타이틀 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.greetingText}>안녕하세요</Text>
          <Text style={styles.sectionTitle}>자주 찾는 서비스</Text>
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
                <Text style={styles.linkText}>{link.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60, // Status bar area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 34,
    height: 34,
    marginRight: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
  },
  searchButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 25,
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 26,
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
    width: 36, // Reduced from 44
    height: 36, // Reduced from 44
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
    fontSize: 14, // Slightly reduced
    fontWeight: '700',
    color: '#333',
    lineHeight: 20,
  },
});
