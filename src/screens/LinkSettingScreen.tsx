import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DraggableGrid } from 'react-native-draggable-grid';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS } from '../constants/colors';
import AppText from '../components/AppText';
import { moderateScale } from '../utils/responsive';
import { useLinkSettingLogic } from '../hooks/screens/useLinkSettingLogic';

type LinkSettingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LinkSetting'>;

interface Props {
  navigation: LinkSettingNavigationProp;
}

export default function LinkSettingScreen({ navigation }: Props) {
  const {
    selectedIds,
    gridData,
    setGridData,
    isLoading,
    scrollEnabled,
    setScrollEnabled,
    scrollViewRef,
    saveSettings,
    toggleLink,
    handleScroll,
    stopAutoScroll,
    handleDragging,
    handleDragStart,
  } = useLinkSettingLogic(navigation);

  if (isLoading) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color="#111" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>홈 화면 설정</AppText>
          <TouchableOpacity onPress={saveSettings} style={styles.headerButton}>
            <AppText style={styles.saveText}>완료</AppText>
          </TouchableOpacity>
        </View>

        {/* 본문 설명 */}
        <View style={styles.descriptionContainer}>
          <AppText style={styles.descriptionTitle}>바로가기 링크 편집</AppText>
          <AppText style={styles.descriptionText}>
            홈 화면에 표시할 수 있는 링크 메뉴입니다.{'\n'}원하는 링크를 선택하거나 해제해보세요.
          </AppText>
        </View>

        {/* 링크 목록 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.gridOuterWrapper}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          <DraggableGrid
            numColumns={4}
            itemHeight={110}
            onItemPress={item => toggleLink(item.id)}
            renderItem={item => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <View key={item.key} style={styles.linkItem}>
                  <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                    <Ionicons
                      name={item.icon as any}
                      size={28}
                      color={isSelected ? COLORS.primary : '#9CA3AF'}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <AppText
                      style={[styles.linkTitle, isSelected && styles.linkTitleSelected]}
                      numberOfLines={2}>
                      {item.title}
                    </AppText>
                  </View>
                </View>
              );
            }}
            data={gridData}
            onDragging={handleDragging}
            onDragStart={handleDragStart}
            onDragRelease={newData => {
              setGridData(newData);
              setScrollEnabled(true);
              stopAutoScroll();
            }}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerButton: {
    padding: 8,
    minWidth: 44, // 터치 영역 확보
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18, 0.3),
    fontWeight: 'bold',
    color: '#111',
  },
  saveText: {
    fontSize: moderateScale(16, 0.3),
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'right',
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  descriptionTitle: {
    fontSize: moderateScale(18, 0.3),
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: moderateScale(14, 0.3),
    color: '#6B7280',
    lineHeight: moderateScale(20, 0.3),
  },
  gridOuterWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flex: 1, // 리스트가 넘어갈 경우 뷰포트 확보
  },
  linkItem: {
    width: '100%',
    height: 120, // 카드의 고정 높이 지정 (드래그 시 크기 유지)
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingHorizontal: 5,
  },
  iconWrapper: {
    width: moderateScale(48, 0.3),
    height: moderateScale(48, 0.3),
    borderRadius: 16,
    backgroundColor: '#F3F4F6', // 회색 (미선택)
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(219, 31, 38, 0.05)', // 빨간색 틴트 (선택)
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  linkTitle: {
    fontSize: moderateScale(12, 0.3),
    fontWeight: 'bold',
    color: '#9CA3AF', // 회색 (미선택)
    textAlign: 'center',
    lineHeight: moderateScale(16, 0.3),
  },
  linkTitleSelected: {
    color: COLORS.primary, // 빨간색 (선택)
  },
});
