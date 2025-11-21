import { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { ItemsContext } from '../data/ItemsContext';
import ItemForm from '../components/items/ItemForm';

export default function ItemEditScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { getItem, updateItem } = useContext(ItemsContext);
  const initialItem = getItem(id);
  if (!initialItem) return null;

  return (
    <View style={styles.page}>
      <ItemForm
        initial={initialItem}
        onSubmit={(form) => { 
            updateItem(id, form); // Context 업데이트
            navigation.goBack(); 
        }}
        onCancel={() => navigation.goBack()}
      />
    </View>
  );
}

// ItemEditScreen.js 파일 맨 아래에 추가
const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
});