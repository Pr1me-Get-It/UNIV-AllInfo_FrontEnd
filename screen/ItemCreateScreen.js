import { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { ItemsContext } from '../data/ItemsContext';
import ItemForm from '../components/items/ItemForm';

export default function ItemCreateScreen({ route, navigation }) {
  const { addItem } = useContext(ItemsContext);

  return (
    <View style={styles.page}>
      <ItemForm
        onSubmit={(form) => {
          const newItem = { id: Date.now(), ...form };
          addItem(newItem); 
          navigation.goBack();
        }}
        onCancel={() => navigation.goBack()}
      />
    </View>
  );
}

// ItemCreateScreen.js 파일 맨 아래에 추가
const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 60, // 상단 여백
    backgroundColor: '#fff',
  },
});