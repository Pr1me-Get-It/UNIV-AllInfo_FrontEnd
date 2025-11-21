// screen/ItemsListScreen.js
import { useState, useContext } from 'react';
import { View, FlatList, TextInput, StyleSheet, Text } from 'react-native';
import { ItemsContext } from '../data/ItemsContext';
import ItemCard from '../components/items/ItemCard';
import ButtonPrimary from '../components/ui/ButtonPrimary';

export default function ItemsListScreen({ navigation }) {
  // 1. Context가 깨져도 빈 객체 {} 반환
  const context = useContext(ItemsContext) || {};
  // 2. items가 없으면 빈 배열 [] 반환 (여기가 제일 중요)
  const items = context.items || [];

  const [query, setQuery] = useState('');

  // 3. items가 배열인지 확인하고 필터 돌림
  const filtered = Array.isArray(items) ? items.filter(i => {
    const name = i?.name || ''; 
    const desc = i?.description || ''; 
    const text = [name, desc].join(' ').toLowerCase();
    return text.includes(query.toLowerCase());
  }) : [];

  return (
    <View style={styles.page}>
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

      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { id: item.id })}
          />
        )}
        // 데이터 없을 때 보여줄 화면
        ListEmptyComponent={
            <View style={{ marginTop: 50, alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>상품이 없습니다.</Text>
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