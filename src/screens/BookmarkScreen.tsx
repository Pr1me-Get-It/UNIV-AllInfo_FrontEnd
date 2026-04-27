// screen/BookmarkScreen.jsx
import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import LoginPlaceholder from '../components/ui/LoginPlaceholder';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useBookmarkLogic } from '../hooks/screens/useBookmarkLogic';

type BookmarkScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bookmark'>;

interface Props {
  navigation: BookmarkScreenNavigationProp;
}

export default function BookmarkScreen({ navigation }: Props) {
  const { isAuthenticated, bookmarkedItems, handlePressItem } = useBookmarkLogic(navigation);

  // 2. 비로그인 상태일 때의 처리
  if (!isAuthenticated) {
    return <LoginPlaceholder />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="star" size={28} color="#FFD700" />
        <AppText style={styles.headerText}>즐겨찾기</AppText>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={bookmarkedItems}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <AppText style={styles.emptyText}>저장된 알림이 없습니다.</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => handlePressItem(item)}>
              <View style={styles.iconBackground}>
                <Image source={item.image} style={styles.customIcon} contentFit="contain" />
              </View>
              <View style={styles.textWrapper}>
                <AppText style={styles.itemText} numberOfLines={1}>
                  {item.title}
                </AppText>
                <Ionicons name="star" size={20} color="#FFD700" />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#f5f5f5' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginLeft: 20 },
  headerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: '#333' },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 110,
    paddingVertical: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconBackground: {
    backgroundColor: 'transparent',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  customIcon: { width: 40, height: 40 },
  textWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1, marginRight: 10 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16 },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  msg: { fontSize: 16, color: 'rgba(136, 136, 136, 1)', marginBottom: 15 },
  btn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
});
