import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXTERNAL_LINKS } from '../constants/links';
import { COLORS } from '../constants/colors';

export default function HomeScreen() {

  const handleOpenLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('에러', '연결할 수 없는 링크입니다.');
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  return (
    <View style={styles.page}>
      {/* 상단 헤더 섹션 (로고 및 검색) */}
      <View style={styles.topBar}>
        <Image
          source={require('../assets/cow.png')}
          style={styles.logoIcon}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => Alert.alert('검색', '준비 중입니다.')}
        >
          <Ionicons name="search" size={26} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 섹션 타이틀 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>서비스 바로가기</Text>
        </View>

        {/* 링크 그리드 */}
        <View style={styles.gridContainer}>
          {EXTERNAL_LINKS.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={styles.linkButton}
              onPress={() => handleOpenLink(link.url)}
            >
              <View style={styles.iconContainer}>
                {/* links.js에 icon 이름이 있다면 적용, 없으면 기본 아이콘 */}
                <Ionicons name={link.icon as any || "link-outline"} size={28} color={COLORS.primary || "#333"} />
              </View>
              <Text style={styles.linkText}>{link.title}</Text>
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
    paddingTop: 50,
    paddingHorizontal: 20
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    marginBottom: 10,
  },
  logoIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
  },
  searchButton: {
    padding: 5,
  },
  sectionHeader: {
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  linkButton: {
    width: '33%', // 간격을 위해 살짝 조정
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 5,
    marginBottom: 15,
    alignItems: 'center',
    // 그림자 설정
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
});