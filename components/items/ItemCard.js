import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

export default function ItemCard({ item, onPress }) {
  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.8 }]}
    >
      {/* 수정된 부분: source prop을 명시했습니다. */}
      <Image 
        source={{ uri: 'https://picsum.photos/seed/' + item.id + '/120' }}
        style={styles.thumb}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        {/* toLocaleString()은 item.price가 숫자형일 때만 작동하므로 주의가 필요합니다. */}
        <Text style={styles.price}>{item.price ? item.price.toLocaleString() : 0}원</Text>
      </View>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2, // 안드로이드 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: '#eee', 
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});