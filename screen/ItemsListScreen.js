import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TextInput, StyleSheet, Text, RefreshControl, Alert } from 'react-native';
import ItemCard from '../components/items/ItemCard';
import ButtonPrimary from '../components/ui/ButtonPrimary';
// API: 목록 조회 함수 가져오기
import { getItems } from "../api/items";

export default function ItemsListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 데이터 불러오기
  const load = useCallback(async () => {
    try {
      const data = await getItems();
      console.log(data);
      // items가 배열인지 확인 후 설정
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert("오류", e.message);
    }
  }, []);

  // 화면이 포커스될 때마다(탭 이동, 뒤로가기 등) 데이터 갱신
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  // 당겨서 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // 검색 필터링
  const filtered = items.filter(i => {
    const name = i?.name || ''; 
    const desc = i?.description || ''; 
    const text = [name, desc].join(' ').toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <View style={styles.page}>
      {/* 상단: 검색바 + 추가 버튼 */}
      <View style={styles.row}>
        <TextInput
          placeholder="검색…"
          placeholderTextColor="#777"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <ButtonPrimary 
            title="추가" 
            onPress={() => navigation.navigate('Create')} 
            style={{ paddingVertical: 12, paddingHorizontal: 20 }}
        />
      </View>

      {/* 목록 리스트 */}
      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
          />
        )}
        ListEmptyComponent={
            <View style={{ marginTop: 50, alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>등록된 상품이 없습니다.</Text>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    paddingTop: 60, 
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
    alignItems: 'center',
  },
  search: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
});