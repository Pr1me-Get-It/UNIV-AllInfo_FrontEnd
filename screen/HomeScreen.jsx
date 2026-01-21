/* screen/HomeScreen.jsx */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <View style={styles.page}>
      {/* 상단 헤더 섹션 */}
      <View style={styles.header}>
        {/* 좌측: Adaptive Icon */}
        <Image 
          source={require('../assets/cow.png')} 
          style={styles.adaptiveIcon} 
          resizeMode="contain"
        />
        
        {/* 우측: 돋보기 UI (ProfileScreen의 스타일 적용) */}
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => Alert.alert('검색', '준비 중')}
        >
          <Ionicons name="search" size={26} color="#555" />
        </TouchableOpacity>
      </View>

      {/* 중앙 컨텐츠 */}
      <View style={styles.container}>
        <Text style={styles.text}>개발 준비 중</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { 
    flex: 1, 
    backgroundColor: '#F3F4F6', 
    paddingTop: 60, // ProfileScreen과 동일한 상단 여백
    paddingHorizontal: 20 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  adaptiveIcon: {
    width: 40,
    height: 40,
  },
  searchButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -100, // 텍스트를 화면 정중앙에 가깝게 배치
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
});