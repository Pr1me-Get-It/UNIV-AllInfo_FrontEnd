import { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ItemsContext } from '../data/ItemsContext';
import ButtonPrimary from '../components/ui/ButtonPrimary';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function ItemDetailScreen({ route, navigation }) {
  const { id, get, remove, update } = route.params || {};
  const { getItem, removeItem, updateItem } = useContext(ItemsContext);
  const [item, setItem] = useState(null);
  const [showDel, setShowDel] = useState(false);

  useEffect(() => {
    if (id && getItem) {
        setItem(getItem(id));
    }
  }, [id, getItem]);

  if (!item) return <View style={styles.page}><Text>정보를 불러오는 중...</Text></View>;

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{item?.name || '이름 없음'}</Text>
      <Text style={styles.desc}>{item?.description || '설명 없음'}</Text>
      <Text style={styles.price}>
        {(Number(item?.price) || 0).toLocaleString()}원
      </Text>

      <View style={{ height: 16 }} />

      <ButtonPrimary
	      title="수정하기"
        onPress={() => navigation.navigate('Edit', { id: item.id })}
      />
      <View style={{ height: 8 }} />
      <ButtonPrimary title="삭제하기" onPress={() => setShowDel(true)} style={{ backgroundColor: '#E5484D' }} />

      <ConfirmModal
	      visible={showDel}
        message="정말 삭제할까요?"
        onCancel={() => setShowDel(false)}
        onConfirm={() => { 
            removeItem(item.id); 
            setShowDel(false); 
            navigation.goBack(); 
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2f5fd3',
  },
});